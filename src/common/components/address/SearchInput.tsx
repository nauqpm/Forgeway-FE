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
    <div className="sticky top-0 bg-white dark:bg-[#202020] p-2 border-b border-[#EAEAEA] dark:border-white/8">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full p-2 border border-[#EAEAEA] dark:border-white/8 dark:bg-[#252525] dark:text-[#E8E8E7] focus:outline-none focus:border-[#2563EB] rounded-[6px] text-[0.8125rem] text-[#111111]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleSearchInputClick}
      />
    </div>
  );
};

export default SearchInput;
