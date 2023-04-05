import classNames from "classnames";
import {
  ReactElement,
  ReactFragment,
  useEffect,
  useRef,
  useState,
} from "react";

export type AccordionChild = ReactElement | ReactFragment | string;

export interface AccordionItem {
  heading: AccordionChild;
  content: AccordionChild;
  id: string;
  defaultExpanded?: boolean;
}

function AccordionControls({
  expanded,
  hydrated,
  onClick,
}: {
  expanded: boolean;
  hydrated: boolean;
  onClick: () => void;
}) {
  if (!hydrated) {
    return null;
  }

  return (
    <div className="govuk-accordion__controls">
      <button
        type="button"
        className="govuk-accordion__show-all"
        aria-expanded={expanded}
        onClick={onClick}
      >
        <span
          className={classNames("govuk-accordion-nav__chevron", {
            "govuk-accordion-nav__chevron--down": !expanded,
          })}
        ></span>
        <span className="govuk-accordion__show-all-text">
          {expanded ? "Hide" : "Show"} all sections
        </span>
      </button>
    </div>
  );
}

function AccordionHeadingButton({
  sectionId,
  headingId,
  expanded,
  hydrated,
  setSectionExpandedState,
  children,
}: {
  sectionId: string;
  headingId: string;
  expanded: boolean;
  hydrated: boolean;
  setSectionExpandedState: (id: string, expanded: boolean) => void;
  children: AccordionChild;
}) {
  if (!hydrated) {
    return (
      <span className="govuk-accordion__section-button" id={headingId}>
        {children}
      </span>
    );
  }

  const toggleLabel = expanded ? "Hide" : "Show";

  return (
    <button
      type="button"
      aria-controls={sectionId}
      className="govuk-accordion__section-button"
      aria-expanded={expanded}
      aria-label={`${children} , ${toggleLabel} this section`}
      onClick={() => setSectionExpandedState(sectionId, !expanded)}
    >
      <span className="govuk-accordion__section-heading-text" id={headingId}>
        <span className="govuk-accordion__section-heading-text-focus">
          {children}
        </span>
      </span>
      <span className="govuk-visually-hidden govuk-accordion__section-heading-divider">
        ,
      </span>
      <span className="govuk-accordion__section-toggle" data-nosnippet="">
        <span className="govuk-accordion__section-toggle-focus">
          <span
            className={classNames("govuk-accordion-nav__chevron", {
              "govuk-accordion-nav__chevron--down": !expanded,
            })}
          ></span>
          <span className="govuk-accordion__section-toggle-text">
            {toggleLabel}
          </span>
        </span>
      </span>
    </button>
  );
}

function AccordionSection({
  expanded,
  headingId,
  hydrated,
  item,
  setSectionExpandedState,
}: {
  expanded: boolean;
  headingId: string;
  hydrated: boolean;
  item: AccordionItem;
  setSectionExpandedState: (id: string, expanded: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const handleBeforeMatch = () => {
      setSectionExpandedState(item.id, true);
    };

    if (expanded) {
      element.removeAttribute("hidden");
      return undefined;
    }

    element.addEventListener("beforematch", handleBeforeMatch);
    element.setAttribute("hidden", "until-found");

    return () => {
      element.removeEventListener("beforematch", handleBeforeMatch);
    };
  }, [expanded]);

  return (
    <div
      className={classNames("govuk-accordion__section", {
        "govuk-accordion__section--expanded": expanded,
      })}
    >
      <div className="govuk-accordion__section-header">
        <h2 className="govuk-accordion__section-heading">
          <AccordionHeadingButton
            headingId={headingId}
            sectionId={item.id}
            setSectionExpandedState={setSectionExpandedState}
            expanded={expanded}
            hydrated={hydrated}
          >
            {item.heading}
          </AccordionHeadingButton>
        </h2>
      </div>
      <div
        id={item.id}
        className="govuk-accordion__section-content"
        aria-labelledby={headingId}
        ref={ref}
      >
        <p className="govuk-body">{item.content}</p>
      </div>
    </div>
  );
}

function useIsHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const hydrated = useIsHydrated();

  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (hydrated) {
      return;
    }

    setExpandedSectionIds(
      new Set(
        items
          .filter((item) => {
            const sessionState = window.sessionStorage.getItem(
              `moduk.accordion.${item.id}.expanded`
            );
            return sessionState !== null
              ? sessionState === "1"
              : item.defaultExpanded;
          })
          .map((item) => item.id)
      )
    );
  }, [hydrated]);

  const saveSectionExpandedState = (sectionId: string, expanded: boolean) => {
    window.sessionStorage.setItem(
      `moduk.accordion.${sectionId}.expanded`,
      expanded ? "1" : "0"
    );
  };

  const saveAllSectionExpandedState = (expanded: boolean) => {
    items.forEach((item) => {
      window.sessionStorage.setItem(
        `moduk.accordion.${item.id}.expanded`,
        expanded ? "1" : "0"
      );
    });
  };

  const allExpanded = items.every((item) => expandedSectionIds.has(item.id));

  const handleShowAllClick = () => {
    if (allExpanded) {
      setExpandedSectionIds(new Set());
      saveAllSectionExpandedState(false);
      return;
    }

    setExpandedSectionIds(new Set(items.map((item) => item.id)));
    saveAllSectionExpandedState(true);
  };

  const setSectionExpandedState = (id: string, expanded: boolean) => {
    saveSectionExpandedState(id, expanded);
    setExpandedSectionIds((expandedSectionIds) => {
      const newExpandedSectionIds = new Set(expandedSectionIds);

      if (expanded) {
        return newExpandedSectionIds.add(id);
      }

      newExpandedSectionIds.delete(id);
      return newExpandedSectionIds;
    });
  };

  return (
    <div
      className="govuk-accordion"
      data-module="govuk-accordion"
      id="accordion-default"
    >
      <AccordionControls
        onClick={handleShowAllClick}
        hydrated={hydrated}
        expanded={allExpanded}
      />

      {items.map((item, index) => (
        <AccordionSection
          setSectionExpandedState={setSectionExpandedState}
          expanded={expandedSectionIds.has(item.id)}
          hydrated={hydrated}
          headingId={`${item.id}-heading`}
          item={item}
          key={item.id}
        />
      ))}
    </div>
  );
}
