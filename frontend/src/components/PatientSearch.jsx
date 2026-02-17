import { useState, useEffect, useRef } from 'react';

export default function PatientSearch({
  onSearch,
  onSelect,
  results = [],
  searchPerformed = false,
}) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (onSearch) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    }
  };

  return (
    <div>
      <input type="text" placeholder="Search patients..." value={query} onChange={handleChange} />
      {results.length > 0 && (
        <ul>
          {results.map((patient) => (
            <li key={patient.id}>
              <button onClick={() => onSelect(patient)}>
                {patient.first_name} {patient.last_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchPerformed && results.length === 0 && <p>No patients found</p>}
    </div>
  );
}
