import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface TemplateSection {
  id: string;
  title: string;
  description: string;
  order: number;
  required: boolean;
  promptQuestions: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  targetAgeRange: [number, number];
  themeTags: string[];
  sections: TemplateSection[];
  isPublic: boolean;
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_SECTION: TemplateSection = {
  id: '',
  title: '',
  description: '',
  order: 0,
  required: true,
  promptQuestions: ['']
};

const DEFAULT_TEMPLATE: Template = {
  id: '',
  name: '',
  description: '',
  targetAgeRange: [3, 8],
  themeTags: [],
  sections: [],
  isPublic: false
};

// Template API service
const templateApi = {
  async getAllTemplates(): Promise<Template[]> {
    try {
      const response = await fetch('http://localhost:3000/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  },

  async getPublicTemplates(): Promise<Template[]> {
    try {
      const response = await fetch('http://localhost:3000/api/templates/public-templates');
      if (!response.ok) throw new Error('Failed to fetch public templates');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching public templates:', error);
      return [];
    }
  },

  async createTemplate(template: Template): Promise<Template | null> {
    try {
      // For demo purposes, assign a mock author ID
      const templateWithAuthor = {
        ...template,
        authorId: template.authorId || 'user-123'
      };
      
      const response = await fetch('http://localhost:3000/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateWithAuthor)
      });
      
      if (!response.ok) throw new Error('Failed to create template');
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  },

  async updateTemplate(id: string, template: Partial<Template>): Promise<Template | null> {
    try {
      const response = await fetch(`http://localhost:3000/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) throw new Error('Failed to update template');
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }
};

const TemplateBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template>({ ...DEFAULT_TEMPLATE });
  const [currentSection, setCurrentSection] = useState<TemplateSection>({ ...DEFAULT_SECTION });
  const [editingSection, setEditingSection] = useState<boolean>(false);
  const [newTag, setNewTag] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from API first
        let fetchedTemplates = await templateApi.getAllTemplates();
        
        // If API fails or returns empty, use mock data
        if (fetchedTemplates.length === 0) {
          fetchedTemplates = [
            {
              id: '1',
              name: 'Adventure Story',
              description: 'A template for creating exciting adventure stories',
              targetAgeRange: [5, 10],
              themeTags: ['adventure', 'exploration', 'journey'],
              sections: [
                {
                  id: '101',
                  title: 'Introduction',
                  description: 'Introduce the main character and their world',
                  order: 1,
                  required: true,
                  promptQuestions: ['Who is your main character?', 'Where do they live?']
                },
                {
                  id: '102',
                  title: 'The Challenge',
                  description: 'What problem or challenge will the character face?',
                  order: 2,
                  required: true,
                  promptQuestions: ['What problem arises?', 'Why is it important to solve?']
                }
              ],
              isPublic: true
            },
            {
              id: '2',
              name: 'Bedtime Story',
              description: 'A calm, soothing story perfect for bedtime reading',
              targetAgeRange: [3, 7],
              themeTags: ['bedtime', 'dreams', 'night'],
              sections: [
                {
                  id: '201',
                  title: 'Evening Setting',
                  description: 'Describe the peaceful evening setting',
                  order: 1,
                  required: true,
                  promptQuestions: ['What time of day is it?', 'What is the weather like?']
                }
              ],
              isPublic: true
            }
          ];
        }
        
        setTemplates(fetchedTemplates);
        setErrorMessage('');
      } catch (error) {
        console.error('Error in fetchTemplates:', error);
        setErrorMessage('Failed to load templates. Using demo data instead.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentTemplate({ ...currentTemplate, [name]: value });
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newRange = [...currentTemplate.targetAgeRange];
    newRange[index] = parseInt(e.target.value);
    setCurrentTemplate({ ...currentTemplate, targetAgeRange: newRange as [number, number] });
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSection({ ...currentSection, [name]: value });
  };

  const handleAddPromptQuestion = () => {
    setCurrentSection({
      ...currentSection,
      promptQuestions: [...currentSection.promptQuestions, '']
    });
  };

  const handlePromptQuestionChange = (index: number, value: string) => {
    const newQuestions = [...currentSection.promptQuestions];
    newQuestions[index] = value;
    setCurrentSection({ ...currentSection, promptQuestions: newQuestions });
  };

  const handleRemovePromptQuestion = (index: number) => {
    setCurrentSection({
      ...currentSection,
      promptQuestions: currentSection.promptQuestions.filter((_, i) => i !== index)
    });
  };

  const handleAddSection = () => {
    if (!currentSection.title.trim()) return;
    
    const newSection = {
      ...currentSection,
      id: currentSection.id || uuidv4(),
      order: currentTemplate.sections.length + 1
    };
    
    setCurrentTemplate({
      ...currentTemplate,
      sections: [...currentTemplate.sections, newSection]
    });
    
    setCurrentSection({ ...DEFAULT_SECTION });
    setEditingSection(false);
  };

  const handleEditSection = (section: TemplateSection) => {
    setCurrentSection({ ...section });
    setEditingSection(true);
  };

  const handleUpdateSection = () => {
    if (!currentSection.title.trim()) return;
    
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.map(section => 
        section.id === currentSection.id ? currentSection : section
      )
    });
    
    setCurrentSection({ ...DEFAULT_SECTION });
    setEditingSection(false);
  };

  const handleRemoveSection = (id: string) => {
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.filter(section => section.id !== id)
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim() || currentTemplate.themeTags.includes(newTag)) {
      setNewTag('');
      return;
    }
    
    setCurrentTemplate({
      ...currentTemplate,
      themeTags: [...currentTemplate.themeTags, newTag]
    });
    
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentTemplate({
      ...currentTemplate,
      themeTags: currentTemplate.themeTags.filter(t => t !== tag)
    });
  };

  const handleTogglePublic = () => {
    setCurrentTemplate({
      ...currentTemplate,
      isPublic: !currentTemplate.isPublic
    });
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name.trim()) return;
    
    setSaveStatus('Saving template...');
    
    try {
      let savedTemplate;
      
      if (currentTemplate.id) {
        // Update existing template
        savedTemplate = await templateApi.updateTemplate(currentTemplate.id, currentTemplate);
      } else {
        // Create new template
        savedTemplate = await templateApi.createTemplate(currentTemplate);
      }
      
      if (savedTemplate) {
        // Update local state
        if (currentTemplate.id) {
          setTemplates(
            templates.map(template => 
              template.id === savedTemplate.id ? savedTemplate : template
            )
          );
        } else {
          setTemplates([...templates, savedTemplate]);
        }
        
        setSaveStatus('Template saved successfully!');
        
        // Reset form for new template
        setCurrentTemplate({ ...DEFAULT_TEMPLATE });
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveStatus('Error saving template. Please try again.');
      
      // Fall back to local state update for demo purposes
      const templateToSave = {
        ...currentTemplate,
        id: currentTemplate.id || uuidv4(),
        authorId: 'user-123'
      };
      
      if (currentTemplate.id) {
        setTemplates(
          templates.map(template => 
            template.id === templateToSave.id ? templateToSave : template
          )
        );
      } else {
        setTemplates([...templates, templateToSave]);
      }
      
      setSaveStatus('Template saved locally (demo mode)');
      setCurrentTemplate({ ...DEFAULT_TEMPLATE });
    }
    
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleSelectTemplate = (template: Template) => {
    setCurrentTemplate({ ...template });
  };

  const handleNewTemplate = () => {
    setCurrentTemplate({ ...DEFAULT_TEMPLATE });
    setCurrentSection({ ...DEFAULT_SECTION });
    setEditingSection(false);
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="template-builder">
      <div className="template-header">
        <h1>Story Template Builder</h1>
        <p>Create and customize templates for different types of stories</p>
        {errorMessage && (
          <div style={{ padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px', marginTop: '1rem' }}>
            {errorMessage}
          </div>
        )}
      </div>
      
      <div className="template-content" style={{ display: 'flex', gap: '2rem' }}>
        <div className="template-list" style={{ width: '30%', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Available Templates</h2>
          {templates.length > 0 ? (
            templates.map(template => (
              <div 
                key={template.id} 
                className="template-item"
                style={{ 
                  padding: '1rem', 
                  marginBottom: '0.5rem', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelectTemplate(template)}
              >
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {template.themeTags.map(tag => (
                    <span key={tag} style={{ 
                      backgroundColor: '#e0f7fa', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                  Ages {template.targetAgeRange[0]}-{template.targetAgeRange[1]}
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontStyle: 'italic', color: '#666' }}>No templates available. Create your first template!</p>
          )}
          <button 
            onClick={handleNewTemplate}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              marginTop: '1rem',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create New Template
          </button>
        </div>
        
        <div className="template-editor" style={{ width: '70%', padding: '1rem' }}>
          <h2>{currentTemplate.id ? 'Edit Template' : 'Create New Template'}</h2>
          
          {saveStatus && (
            <div style={{ padding: '0.75rem', backgroundColor: '#e8f5e9', borderRadius: '4px', marginBottom: '1rem' }}>
              {saveStatus}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="name">Template Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={currentTemplate.name}
              onChange={handleTemplateChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
              placeholder="Adventure Story"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={currentTemplate.description}
              onChange={handleTemplateChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
              placeholder="A template for creating exciting adventure stories"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Target Age Range</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="number"
                value={currentTemplate.targetAgeRange[0]}
                onChange={(e) => handleRangeChange(e, 0)}
                min="1"
                max="18"
                style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <span>to</span>
              <input
                type="number"
                value={currentTemplate.targetAgeRange[1]}
                onChange={(e) => handleRangeChange(e, 1)}
                min="1"
                max="18"
                style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <span>years</span>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Theme Tags</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {currentTemplate.themeTags.map(tag => (
                <div key={tag} style={{ 
                  backgroundColor: '#e0f7fa', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{ 
                      backgroundColor: 'transparent', 
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Add a theme tag (e.g., adventure)"
              />
              <button
                onClick={handleAddTag}
                style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={currentTemplate.isPublic}
                onChange={handleTogglePublic}
              />
              Make this template public
            </label>
          </div>
          
          <div className="section-editor" style={{ marginBottom: '2rem' }}>
            <h3>Template Sections</h3>
            
            {currentTemplate.sections.length > 0 ? (
              <div className="sections-list" style={{ marginBottom: '1.5rem' }}>
                {currentTemplate.sections.sort((a, b) => a.order - b.order).map(section => (
                  <div 
                    key={section.id} 
                    style={{ 
                      padding: '1rem', 
                      marginBottom: '0.5rem', 
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>{section.title}</h4>
                      <div>
                        <button
                          onClick={() => handleEditSection(section)}
                          style={{ 
                            marginRight: '0.5rem',
                            padding: '0.25rem 0.5rem', 
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveSection(section.id)}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p>{section.description}</p>
                    {section.promptQuestions.length > 0 && (
                      <div>
                        <strong>Prompt Questions:</strong>
                        <ul>
                          {section.promptQuestions.map((question, index) => (
                            question && <li key={index}>{question}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#666' }}>No sections added yet. Add a section below.</p>
            )}
            
            <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              <h4>{editingSection ? 'Edit Section' : 'Add New Section'}</h4>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="section-title">Section Title</label>
                <input
                  type="text"
                  id="section-title"
                  name="title"
                  value={currentSection.title}
                  onChange={handleSectionChange}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="Introduction"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="section-description">Description</label>
                <textarea
                  id="section-description"
                  name="description"
                  value={currentSection.description}
                  onChange={handleSectionChange}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="Introduce the main character and their world"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="required"
                    checked={currentSection.required}
                    onChange={(e) => setCurrentSection({ ...currentSection, required: e.target.checked })}
                  />
                  This section is required
                </label>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Prompt Questions</label>
                {currentSection.promptQuestions.map((question, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => handlePromptQuestionChange(index, e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      placeholder="Enter a prompt question for this section"
                    />
                    <button
                      onClick={() => handleRemovePromptQuestion(index)}
                      style={{ 
                        padding: '0.5rem', 
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddPromptQuestion}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    marginTop: '0.5rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add Prompt Question
                </button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setCurrentSection({ ...DEFAULT_SECTION });
                    setEditingSection(false);
                  }}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={editingSection ? handleUpdateSection : handleAddSection}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editingSection ? 'Update Section' : 'Add Section'}
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={handleSaveTemplate}
              disabled={!currentTemplate.name.trim()}
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: currentTemplate.name.trim() ? '#4caf50' : '#e0e0e0',
                color: currentTemplate.name.trim() ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: currentTemplate.name.trim() ? 'pointer' : 'not-allowed',
                fontSize: '1rem'
              }}
            >
              {currentTemplate.id ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder; 