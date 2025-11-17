"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export type GenerationStage = "generating" | "image" | "videos" | "done" | "error";

interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    stage: GenerationStage;
    errorMessage?: string;
}

const stageMap: Record<GenerationStage, { title: string; message: string }> = {
    generating: {
        title: "Generating Content",
        message: "We're creating your post — this usually takes a few seconds.",
    },
    image: {
        title: "Generating your Image",
        message: "Creating a high-quality image for your content.",
    },
    videos: {
        title: "Fetching Related Videos",
        message: "Searching for matching video clips.",
    },
    done: {
        title: "Done",
        message: "Your content is ready!",
    },
    error: {
        title: "Error",
        message: "Something went wrong while generating content.",
    },
};

export default function GenerationProgressModal({ open, onOpenChange, stage, errorMessage }: Props) {
    const { title, message } = stageMap[stage] || stageMap.generating;

    const handleOpenChange = (nextOpen: boolean) => {
        // Prevent closing the dialog by clicking outside or pressing Escape
        // until the generation has completed (done or error).
        if (!nextOpen && stage !== 'done' && stage !== 'error') {
            return;
        }
        onOpenChange?.(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg w-[90vw]">
                <div className="flex flex-col items-center gap-4 py-6">
                    {stage !== "done" && stage !== "error" ? (
                        <div className="p-4 rounded-full bg-slate-100">
                            <Loader2 className="animate-spin h-10 w-10 text-slate-700" />
                        </div>
                    ) : (
                        <div className="p-4 rounded-full bg-slate-100">
                            {/* Simple check mark or warning could be added here for done/error */}
                            <div className="h-10 w-10 flex items-center justify-center text-slate-700 font-semibold">
                                {stage === "done" ? "✓" : "!"}
                            </div>
                        </div>
                    )}

                    <h3 className="text-lg font-semibold text-black">{title}</h3>
                    <p className="text-sm text-slate-600 text-center px-4">
                        {stage === "error" && errorMessage ? errorMessage : message}
                    </p>

                    {/* removed progress bar as requested */}

                    <div className="w-full px-6">
                        <div className="flex justify-center">
                            {stage === "done" && (
                                <Button onClick={() => onOpenChange?.(false)}>Close</Button>
                            )}
                            {stage === "error" && (
                                <Button variant="destructive" onClick={() => onOpenChange?.(false)}>
                                    Close
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
