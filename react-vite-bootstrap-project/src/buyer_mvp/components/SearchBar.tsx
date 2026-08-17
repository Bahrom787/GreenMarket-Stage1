import { type FormEvent, useState } from 'react';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
}

export function SearchBar({
  initialValue = '',
  placeholder = 'Найти товар',
  onSearch,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form className="gm-buyer-search" onSubmit={handleSubmit} role="search">
      <span className="gm-buyer-search__icon" aria-hidden="true" />
      <input
        className="gm-buyer-search__input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="gm-buyer-search__button">
        Найти
      </button>
    </form>
  );
}
