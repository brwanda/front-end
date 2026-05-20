import React from 'react';
import './ui.css';

const PageShell = ({ title, subtitle, actions, className = '', children }) => {
  return (
    <section className={`ui-page-shell ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="ui-page-header">
          <div className="ui-page-title-wrap">
            {title ? <h1 className="ui-page-title">{title}</h1> : null}
            {subtitle ? <p className="ui-page-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ui-page-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
};

export default PageShell;
