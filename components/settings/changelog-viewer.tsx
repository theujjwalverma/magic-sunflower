"use client";

import { useState, useEffect } from "react";
import { X, GitCommit, Calendar, Tag } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_VERSION, BUILD_TIMESTAMP } from "@/lib/version";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: string;
    items: string[];
  }[];
}

export function ChangelogViewer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch("/CHANGELOG.md");
        if (!response.ok) {
          throw new Error("Failed to fetch changelog");
        }

        const text = await response.text();
        const parsedChangelog = parseChangelog(text);
        setChangelog(parsedChangelog);
      } catch (error) {
        console.error("Error loading changelog:", error);
        // Fallback to empty changelog
        setChangelog([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchChangelog();
    }
  }, [open]);

  const parseChangelog = (text: string): ChangelogEntry[] => {
    const entries: ChangelogEntry[] = [];
    const lines = text.split("\n");

    let currentEntry: Partial<ChangelogEntry> = {};
    let currentSection: string | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Version header
      if (trimmedLine.startsWith("## [")) {
        if (currentEntry.version) {
          entries.push(currentEntry as ChangelogEntry);
        }

        const versionMatch = trimmedLine.match(/## \[([^\]]+)\]/);
        const dateMatch = trimmedLine.match(
          / - (\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}\.\d{3}Z)?)/
        );

        currentEntry = {
          version: versionMatch ? versionMatch[1] : "Unreleased",
          date: dateMatch ? dateMatch[1] : "",
          changes: [],
        };
        currentSection = null;
      }
      // Section header
      else if (trimmedLine.startsWith("### ")) {
        currentSection = trimmedLine.replace("### ", "").toLowerCase();
      }
      // List item
      else if (
        trimmedLine.startsWith("- ") &&
        currentSection &&
        currentEntry.changes
      ) {
        const item = trimmedLine.substring(2).trim();
        const sectionIndex = currentEntry.changes.findIndex(
          (change) => change.type === currentSection
        );

        if (sectionIndex === -1) {
          currentEntry.changes.push({
            type: currentSection!,
            items: [item],
          });
        } else {
          currentEntry.changes[sectionIndex].items.push(item);
        }
      }
    }

    // Push the last entry
    if (currentEntry.version) {
      entries.push(currentEntry as ChangelogEntry);
    }

    return entries;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unreleased";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "added":
        return "text-green-600";
      case "changed":
        return "text-blue-600";
      case "deprecated":
        return "text-yellow-600";
      case "removed":
        return "text-red-600";
      case "fixed":
        return "text-purple-600";
      case "security":
        return "text-orange-600";
      default:
        return "text-foreground";
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case "added":
        return "➕";
      case "changed":
        return "🔄";
      case "deprecated":
        return "⚠️";
      case "removed":
        return "🗑️";
      case "fixed":
        return "🔧";
      case "security":
        return "🔒";
      default:
        return "📝";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md mx-auto">
        <DrawerHeader className="text-center">
          <DrawerTitle className="flex items-center justify-center gap-2">
            <GitCommit className="h-5 w-5" />
            Changelog
          </DrawerTitle>
          <DrawerDescription>Current version: {APP_VERSION}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading changelog...</p>
            </div>
          ) : changelog.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No changelog entries found.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {changelog.map((entry, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{entry.version}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.date)}
                    </div>
                  </div>

                  {entry.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="space-y-2">
                      <h4
                        className={`font-medium ${getChangeTypeColor(
                          change.type
                        )} flex items-center gap-2`}
                      >
                        {getChangeTypeIcon(change.type)}{" "}
                        {change.type.charAt(0).toUpperCase() +
                          change.type.slice(1)}
                      </h4>
                      <ul className="space-y-1 pl-4">
                        {change.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="text-sm text-muted-foreground"
                          >
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {index < changelog.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full rounded-xl">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
