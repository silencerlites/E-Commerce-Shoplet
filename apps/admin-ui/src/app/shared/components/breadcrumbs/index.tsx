import React from "react";
import Link from "next/link";

type Props = {
  title: string;
  className?: string;
};

export default function BreadCrumbs({ title, className = "" }: Props) {
  return (
    <nav className={`text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li className="flex items-center">
          <Link href="/" legacyBehavior>
            <a className="text-gray-600 hover:text-primary-600 transition-colors">
              Home
            </a>
          </Link>
        </li>

        <li className="flex items-center">
          <svg
            className="w-4 h-4 text-gray-400 mx-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span aria-current="page" className="text-white font-medium">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}