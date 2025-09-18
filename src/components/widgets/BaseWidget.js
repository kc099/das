import React from 'react';
import '../../styles/Widgets.css';

const BaseWidget = ({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  headerActions = null,
  footer = null,
  ...otherProps
}) => {
  return (
    <div className={`widget ${className}`} {...otherProps}>
      <div className="widget-header">
        <div className="widget-header-content">
          <div className="widget-title-section">
            <h3 className="widget-title">{title}</h3>
            {subtitle && <p className="widget-subtitle">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="widget-actions">
              {headerActions}
            </div>
          )}
        </div>
      </div>
      <div className="widget-content">
        {children}
      </div>
      {footer && (
        <div className="widget-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default BaseWidget;