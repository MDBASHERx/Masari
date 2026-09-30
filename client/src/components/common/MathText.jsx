// Keeps math like "3(x − 2) = 2x + 5" left-to-right inside Arabic text,
// so numbers, brackets and operators don't get reordered in RTL.
const ARABIC_RUN = /([\u0600-\u06FF][\u0600-\u06FF\s،؛؟:.]*)/;

function MathText({ text }) {
    return text
        .split(ARABIC_RUN)
        .filter((part) => part !== "")
        .map((part, index) =>
            ARABIC_RUN.test(part) || part.trim() === "" ? (
                <span key={index}>{part}</span>
            ) : (
                <bdi key={index} dir="ltr">{part}</bdi>
            ),
        );
}

export default MathText;
