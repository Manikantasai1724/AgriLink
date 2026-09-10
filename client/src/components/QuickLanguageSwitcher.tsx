import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useLanguage } from "@/hooks/useLanguage";

export function QuickLanguageSwitcher() {
  const { language, languageMeta, languages, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="
            h-9 gap-1 px-1.5 sm:px-2.5
            font-medium
            hover:bg-muted/60
            transition-colors
          "
          aria-label="Change language"
          data-testid="button-language-switcher"
        >
          <Globe className="h-4 w-4 flex-shrink-0" />

          <span className="sm:hidden text-xs uppercase font-bold text-muted-foreground">
            {language}
          </span>
          <span className="hidden sm:inline text-xs">
            {languageMeta.nativeName || languageMeta?.shortName || language}
          </span>

          <ChevronDown className="h-3 w-3 text-muted-foreground hidden xs:inline" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          w-52 rounded-xl
          border bg-background/95
          p-1 shadow-lg
          backdrop-blur
        "
      >
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => void setLanguage(item.id)}
            className="
              flex items-center justify-between
              rounded-md px-3 py-2.5
              cursor-pointer
              transition-colors
              hover:bg-accent
            "
            data-testid={`language-option-${item.id}`}
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {item.nativeName}
              </span>

              {item.nativeName !== item.name && (
                <span className="text-xs text-muted-foreground">
                  {item.name}
                </span>
              )}
            </div>

            {language === item.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}