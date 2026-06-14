"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface PermissionProps {
  resource: string;
  action: string;
}

export const withPermission = (
  WrappedComponent: React.ComponentType,
  { resource, action }: PermissionProps
) => {
  return function PermissionWrapper(props: any) {
    const {
      hasPermission,
      isAuthenticated,
      user,
      fetchUserPermissions,
      isLoadingPermissions,
    } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
      const checkAccess = async () => {
        try {
          // Check authentication first
          if (!isAuthenticated) {
            router.replace("/login");
            setIsLoading(false);
            return;
          }

          // Wait for user data to be loaded
          if (!user) {
            setIsLoading(true);
            return;
          }

          // Admin has all permissions
          if ((user.role as string) === "super_admin" || (user.role as string) === "admin") {
            setHasAccess(true);
            setIsLoading(false);
            return;
          }

          // If permissions are not loaded yet and not currently loading, fetch them
          if (
            (!user.permissions || user.permissions.length === 0) &&
            !isLoadingPermissions
          ) {
            await fetchUserPermissions();
            return; // Will trigger useEffect again when user.permissions are updated
          }

          // Wait until permissions are loaded
          if (isLoadingPermissions) {
            return;
          }

          // Check permission directly with resource and action
          const hasRequiredPermission = hasPermission(resource, action);
          setHasAccess(hasRequiredPermission);

          if (!hasRequiredPermission) {
            router.replace("/unauthorized");
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error in permission check:", error);
          setIsLoading(false);
          setHasAccess(false);
        }
      };

      checkAccess();
    }, [
      isAuthenticated,
      user,
      hasPermission,
      router,
      fetchUserPermissions,
      resource,
      action,
      isLoadingPermissions,
    ]);

    // Show loading while checking
    if (isLoading || isLoadingPermissions) {
      return <div>Checking access permissions...</div>;
    }

    // Render component if access is granted
    return hasAccess ? <WrappedComponent {...props} /> : null;
  };
};
