"use client";

import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { usePageComments } from "../hooks/usePageComments";
import type { PageComment } from "../services/commentsService";

function CommentNode({ comment }: { comment: PageComment }) {
  return (
    <div id={`comment-${comment.id}`} className="scroll-mt-6 border-t border-gray-100 py-3 first:border-t-0 dark:border-gray-800">
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {comment.author?.fullName || comment.author?.email || "Unknown"}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
      {comment.replies?.map((reply) => (
        <div key={reply.id} className="ml-4 border-l border-gray-200 pl-3 dark:border-gray-700">
          <CommentNode comment={reply} />
        </div>
      ))}
    </div>
  );
}

export default function PageSearchComments({ workspaceId, pageId }: { workspaceId: string; pageId: string }) {
  const { comments, isLoading } = usePageComments({ workspaceId, pageId });

  useEffect(() => {
    const id = window.location.hash.replace("#comment-", "");
    if (!id || window.location.hash === "#") return;
    document.getElementById(`comment-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [comments]);

  if (!isLoading && comments.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
        <MessageSquare className="h-4 w-4" /> Comments
      </h2>
      <div className="mt-3">{isLoading ? <p className="text-sm text-gray-500">Loading comments...</p> : comments.map((comment) => <CommentNode key={comment.id} comment={comment} />)}</div>
    </section>
  );
}
