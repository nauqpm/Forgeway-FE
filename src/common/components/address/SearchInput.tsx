import { SearchInputProps } from "./types/location";

const SearchInput = ({
  placeholder,
  value,
  onChange,
  inputRef,
}: SearchInputProps) => {
  const handleSearchInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="sticky top-0 bg-white p-2 border-b">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 focus:outline-none focus:border-blue-500 rounded-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleSearchInputClick}
      />
    </div>
  );
};

export default SearchInput;
