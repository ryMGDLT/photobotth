"use client";

import { Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <Card className="w-full max-w-md border-[#eedab5] bg-[#fffaf0]">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-base font-semibold text-[color:var(--foreground)]">
                Something went wrong
              </p>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {this.state.message}
              </p>
              <Button
                variant="outline"
                className="border-[#c9a67c]"
                onClick={this.handleReset}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
