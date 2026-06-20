import React from "react";

/**
 * Premium Button Component
 * Supports custom styles, loading states, and Lucide React icon alignment with micro-animations.
 * Automatically renders as an anchor (<a>) if the `href` prop is provided.
 */
export default function Button({
  children,
  onClick,
  variant = "primary", // 'primary' | 'secondary' | 'outline' | 'text'
  icon: Icon = null,
  iconPosition = "left", // 'left' | 'right'
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  href = null,
  target = "_blank",
  rel = "noreferrer",
  ...props
}) {
  const classNames = `luxury-btn btn-${variant} ${className} ${loading ? "btn-loading" : ""}`;

  const innerContent = (
    <>
      {loading && (
        <span className="btn-spinner" />
      )}
      
      {!loading && Icon && iconPosition === "left" && (
        <Icon className="btn-icon icon-left" size={16} />
      )}
      
      <span className="btn-text">{children}</span>
      
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="btn-icon icon-right" size={16} />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classNames}
        style={{ textDecoration: "none", display: "inline-flex" }}
        {...props}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classNames}
      {...props}
    >
      {innerContent}
    </button>
  );
}
