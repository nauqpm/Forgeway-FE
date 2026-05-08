import ClientLayout from "@/modules/client/common/layouts/ClientLayout";
import MyPosts from "@/modules/client/post-property/MyPosts";

export default function PostPropertyPage() {
    return (
        <ClientLayout>
            <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-300px)]">
                <MyPosts />
            </div>
        </ClientLayout>
    )
}