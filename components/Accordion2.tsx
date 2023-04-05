import classNames from "classnames";
import {
  Children,
  createContext,
  isValidElement,
  ReactElement,
  ReactFragment,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type AccordionChild = ReactElement | ReactFragment | string;

export interface AccordionItemProps {
  heading: AccordionChild;
  id: string;
  defaultExpanded?: boolean;
  children: AccordionChild;
}

interface AccordionContextProps {
  expandedSectionIds: Set<string>;
  setSectionState: (sectionId: string, expanded: boolean) => void;
  hydrated: boolean;
}

const AccordionContext = createContext<AccordionContextProps>({
  expandedSectionIds: new Set(),
  setSectionState: () => {},
  hydrated: false,
});

function AccordionControls({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
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
  contentId,
  headingId,
  expanded,
  children,
}: {
  contentId: string;
  headingId: string;
  expanded: boolean;
  children: AccordionChild;
}) {
  const accordionContext = useContext(AccordionContext);

  if (!accordionContext.hydrated) {
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
      aria-controls={contentId}
      className="govuk-accordion__section-button"
      aria-expanded={expanded}
      aria-label={`${children} , ${toggleLabel} this section`}
      onClick={() => accordionContext.setSectionState(contentId, !expanded)}
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

export function Accordion2Item({ children, heading, id }: AccordionItemProps) {
  const accordionContext = useContext(AccordionContext);
  const expanded = accordionContext.expandedSectionIds.has(id);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const handleBeforeMatch = () => {
      accordionContext.setSectionState(id, true);
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
            headingId={`${id}-heading`}
            contentId={id}
            expanded={expanded}
          >
            {children}
          </AccordionHeadingButton>
        </h2>
      </div>
      <div
        id={id}
        className="govuk-accordion__section-content"
        aria-labelledby={`${id}-heading`}
        ref={ref}
      >
        <p className="govuk-body">{children}</p>
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

export function Accordion2({
  children,
}: {
  children:
    | ReactElement<AccordionItemProps>[]
    | ReactElement<AccordionItemProps>;
}) {
  const hydrated = useIsHydrated();

  const validChildren = Children.toArray(children).filter(
    isValidElement<AccordionItemProps>
  );

  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    new Set(
      validChildren
        .filter((child) => child.props.defaultExpanded)
        .map((child) => child.props.id)
    )
  );

  useEffect(() => {
    if (hydrated) {
      return;
    }

    setExpandedSectionIds(
      new Set(
        validChildren
          .filter((child) => {
            const sessionState = window.sessionStorage.getItem(
              `moduk.accordion.${child.props.id}.expanded`
            );
            return sessionState !== null
              ? sessionState === "1"
              : child.props.defaultExpanded;
          })
          .map((child) => child.props.id)
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
    validChildren.forEach((child) => {
      window.sessionStorage.setItem(
        `moduk.accordion.${child.props.id}.expanded`,
        expanded ? "1" : "0"
      );
    });
  };

  const allExpanded = validChildren.every((child) =>
    expandedSectionIds.has(child.props.id)
  );

  const handleShowAllClick = () => {
    saveAllSectionExpandedState(!allExpanded);

    if (allExpanded) {
      setExpandedSectionIds(new Set());
      return;
    }

    setExpandedSectionIds(
      new Set(validChildren.map((child) => child.props.id))
    );
  };

  const setSectionState = (sectionId: string, expanded: boolean) => {
    saveSectionExpandedState(sectionId, expanded);

    setExpandedSectionIds((expandedSectionIds) => {
      const newValue = new Set(expandedSectionIds);
      if (expanded) {
        return newValue.add(sectionId);
      }

      newValue.delete(sectionId);
      return newValue;
    });
  };

  return (
    <div
      className="govuk-accordion"
      data-module="govuk-accordion"
      id="accordion-default"
    >
      {hydrated && (
        <AccordionControls
          expanded={allExpanded}
          onClick={handleShowAllClick}
        />
      )}
      <AccordionContext.Provider
        value={{
          expandedSectionIds,
          setSectionState: setSectionState,
          hydrated: hydrated,
        }}
      >
        {children}
      </AccordionContext.Provider>
    </div>
  );
}
