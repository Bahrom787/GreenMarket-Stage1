import { type FormEvent, useState } from 'react';
import { Button } from '@/design-system/components';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
}

export function SearchBar({ initialValue = '', placeholder = 'Найти товар', onSearch }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form className="gm-buyer-search" onSubmit={handleSubmit} role="search">
      <input
        className="gm-buyer-search__input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" variant="primary">
        Найти
      </Button>
    </form>
  );
}
