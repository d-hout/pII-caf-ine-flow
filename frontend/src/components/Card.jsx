import React from 'react';


export default function Card({ as: Component = 'div', title, className = '', children, ...props }) {
  const classes = ['carte', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {title && <h3>{title}</h3>}
      {children}
    </Component>
  );
}
