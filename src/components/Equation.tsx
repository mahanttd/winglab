import katex from "katex";

export function Equation({ children, block = false }: { children: string; block?: boolean }) {
  return (
    <span
      className={block ? "equation equation-block" : "equation"}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(children, {
          throwOnError: false,
          displayMode: block,
          output: "html",
        }),
      }}
    />
  );
}

