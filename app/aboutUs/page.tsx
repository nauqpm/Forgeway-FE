import { Metadata } from "next";
import PropTechAboutUsPage from "./PropTechAboutUsPage";

export const metadata: Metadata = {
  title: "About Us | AL-TASK - Enterprise PropTech Platform",
  description: "Learn more about our mission, core technology capabilities (RBAC, MFA/SSO, Scalable Architecture), and culture workflow at AL-TASK.",
};

export default function Page() {
  return <PropTechAboutUsPage />;
}
