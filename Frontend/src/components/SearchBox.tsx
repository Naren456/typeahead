import { useState, useEffect, useRef } from "react";
import "./SearchBox.css";

interface Suggestion {
  id: number;
  query: string;
  count: number;
}

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:5000/suggest?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const result = await response.json();
          setSuggestions(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    }, 300); 
    
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery); 
    setIsFocused(false);   
    
    try {
      await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
    } catch (error) {
      console.error("Failed to save search:", error);
    }
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div className="search-container">
      {/* Pop Art Logo */}
      <h1 className="pop-logo">POP SEARCH</h1>
      
      <form style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}>
        {/* Search Input Card */}
        <div className="search-wrapper">
        <div className="input-row">
          <svg className="search-icon" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Type something cool..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(query);
            }}
          />
        </div>
        
        {/* Unified Dropdown UI */}
        {showDropdown && (
          <>
            <div className="dropdown-divider"></div>
            <ul className="suggestions-dropdown">
              {suggestions.map((item) => (
                <li 
                  key={item.id} 
                  className="suggestion-item"
                  onClick={() => handleSearch(item.query)}
                >
                  <div className="suggestion-content">
                    <div className="suggestion-left">
                      <svg className="search-icon-small" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                      </svg>
                      <span className="suggestion-text">{item.query}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button type="submit" className="pop-btn">Search Now</button>
          <button type="button" className="pop-btn pop-btn-pink">Feeling Lucky!</button>
        </div>
      </form>
    </div>
  );
}
