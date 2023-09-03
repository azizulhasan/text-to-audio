import React from "react";

export default function Close({ onClick }) {
    return <svg onClick={onClick} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="fs-4 mx-2 cursor-pointer" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M368 368L144 144m224 0L144 368"></path></svg>;
}
