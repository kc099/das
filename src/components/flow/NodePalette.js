import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import '../../styles/NodePalette.css';

function NodePalette({ categories, isCollapsed }) {
  // Initialize category expansion state based on provided categories
  const createInitialExpanded = () => {
    const initial = {};
    Object.keys(categories).forEach((key) => {
      // Keep "common" expanded by default, others collapsed
      initial[key] = key === 'common';
    });
    return initial;
  };

  const [expandedCategories, setExpandedCategories] = useState(createInitialExpanded);

  // When categories prop changes (e.g., devices loaded dynamically), ensure new
  // categories are present in the expanded state so toggling works correctly.
  useEffect(() => {
    setExpandedCategories((prev) => {
      const updated = { ...prev };
      Object.keys(categories).forEach((key) => {
        if (!(key in updated)) {
          updated[key] = key === 'common';
        }
      });
      return updated;
    });
  }, [categories]);

  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const getIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={16} /> : <Icons.Circle size={16} />;
  };

  const filterNodes = (nodes, search) => {
    if (!search) return nodes;
    const filtered = {};
    Object.entries(nodes).forEach(([key, node]) => {
      if (node.label.toLowerCase().includes(search.toLowerCase())) {
        filtered[key] = node;
      }
      // Also check subtypes
      if (node.subtypes) {
        const filteredSubtypes = {};
        Object.entries(node.subtypes).forEach(([subKey, subNode]) => {
          if (subNode.label.toLowerCase().includes(search.toLowerCase())) {
            filteredSubtypes[subKey] = subNode;
          }
        });
        if (Object.keys(filteredSubtypes).length > 0) {
          filtered[key] = { ...node, subtypes: filteredSubtypes };
        }
      }
    });
    return filtered;
  };

  if (isCollapsed) {
    return (
      <div className="node-palette collapsed">
        <div className="palette-header">
          <Icons.Menu size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>Node Palette</h3>
        <div className="search-box">
          <Icons.Search size={16} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="palette-content">
        {Object.entries(categories).map(([categoryKey, category]) => {
          const filteredNodes = filterNodes(category.nodes, searchTerm);
          
          if (Object.keys(filteredNodes).length === 0 && searchTerm) {
            return null;
          }

          return (
            <div key={categoryKey} className="category">
              <div
                className="category-header"
                onClick={() => toggleCategory(categoryKey)}
                style={{ borderColor: category.color }}
              >
                <div className="category-title">
                  <div 
                    className="category-color" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.label}</span>
                </div>
                <Icons.ChevronDown
                  size={16}
                  className={`chevron ${expandedCategories[categoryKey] ? 'expanded' : ''}`}
                />
              </div>

              {expandedCategories[categoryKey] && (
                <div className="category-nodes">
                  {Object.entries(filteredNodes).map(([nodeKey, node]) => {
                    // Handle nodes with subtypes
                    if (node.subtypes) {
                      return (
                        <div key={nodeKey} className="node-group">
                          <div className="node-group-header">
                            {getIcon(node.icon)}
                            <span>{node.label}</span>
                          </div>
                          {Object.entries(node.subtypes).map(([subtypeKey, subtype]) => (
                            <div
                              key={`${nodeKey}-${subtypeKey}`}
                              className="palette-node subtype"
                              style={{ borderLeftColor: category.color }}
                              draggable
                              onDragStart={(event) =>
                                onDragStart(event, {
                                  category: categoryKey,
                                  nodeType: nodeKey,
                                  subtype: subtypeKey,
                                  label: subtype.label,
                                  config: subtype.config
                                })
                              }
                            >
                              <div className="node-icon" style={{ color: category.color }}>
                                {getIcon(node.icon)}
                              </div>
                              <span className="node-label">{subtype.label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Handle regular nodes
                    return (
                      <div
                        key={nodeKey}
                        className="palette-node"
                        style={{ borderLeftColor: category.color }}
                        draggable
                        onDragStart={(event) =>
                          onDragStart(event, {
                            category: categoryKey,
                            nodeType: nodeKey,
                            label: node.label,
                            config: node.config
                          })
                        }
                      >
                        <div className="node-icon" style={{ color: category.color }}>
                          {getIcon(node.icon)}
                        </div>
                        <span className="node-label">{node.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NodePalette;