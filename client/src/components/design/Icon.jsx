const paths = {
    home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
    book: "M12 5v16M12 5C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 1Z",
    path: "M6 3v5a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v5M3 6l3-3 3 3M15 18l3 3 3-3",
    chat: "M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8ZM7 9h10M7 13h6",
    compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM16 8l-3 5-5 3 3-5Z",
    chart: "M4 3v18h17M8 16v-4M13 16V8M18 16V5",
    grades: "M7 3h10v3H7ZM7 4H4v17h16V4h-3M8 11h8M8 16h5",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3",
    spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
    arrow: "M20 12H4m6-6-6 6 6 6",
    sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
};
export default function Icon({ name, size = 24, className = "" }) {
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.spark} /></svg>;
}
