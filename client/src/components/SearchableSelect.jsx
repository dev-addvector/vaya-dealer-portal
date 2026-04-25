import { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
  className = '',
  containerClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option === value);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleOptionClick = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = (e) => {
    // Delay closing to allow option clicks
    setTimeout(() => {
      if (!containerRef.current?.contains(e.relatedTarget)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && isOpen) {
      const highlightedElement = containerRef.current?.querySelector(
        `[data-option-index="${highlightedIndex}"]`
      );
      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${containerClassName}`}
    >
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchTerm : (selectedOption || '')}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-[6px] py-1 text-[13px] border border-[#ccc] rounded-[3px] h-[30px] bg-white outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] ${disabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'} ${className}`}
      />
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#ccc] rounded-[3px] shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-[13px] text-gray-500">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option}
                data-option-index={index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleOptionClick(option)}
                className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-[#f0f0f0] ${
                  highlightedIndex === index ? 'bg-[#e6f3ff]' : ''
                } ${option === value ? 'bg-[#007bff] text-white font-medium' : ''}`}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
