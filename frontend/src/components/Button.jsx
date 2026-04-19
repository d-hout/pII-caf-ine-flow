import React from 'react';

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  let variantClass = '';
  if (variant === 'primary') variantClass = 'bouton-primaire';
  else if (variant === 'outline') variantClass = 'bouton-contour';
  else if (variant === 'link') variantClass = 'bouton-lien';

  const classes = ['bouton', variantClass, className].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
