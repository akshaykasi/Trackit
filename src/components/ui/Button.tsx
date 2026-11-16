import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { pillClass, type ButtonVariant } from "./pill";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return <button type={type} className={`${pillClass(variant)} ${className}`} {...rest} />;
}

interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}

/** Internal-navigation pill rendered as a react-router link. */
export function ButtonLink({ to, variant = "primary", className = "", children }: ButtonLinkProps) {
  return (
    <Link to={to} className={`${pillClass(variant)} ${className}`}>
      {children}
    </Link>
  );
}
