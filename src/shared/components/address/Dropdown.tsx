import { IoChevronDown, IoChevronUp, IoLocationOutline } from "react-icons/io5";
import { DropdownProps } from "@/shared/components/address/types/location";

const Dropdown = ({
  label,
  value,
  isOpen,
  isDisabled,
  hasError,
  errorMessage,
  onToggle,
  children,
}: DropdownProps) => {
  return (
    <div className="flex flex-col">
      <label className="block text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative h-10">
        <div
          className={`absolute inset-0 py-2 px-3 flex justify-between items-center border
            ${hasError ? "border-red-500" : "border-[#EAEAEA] dark:border-white/[0.06]"}
            bg-white dark:bg-[#202020] rounded-[6px]
            ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={isDisabled ? undefined : onToggle}
        >
          <div className="flex items-center overflow-hidden">
            <IoLocationOutline className="text-[#787774] dark:text-[#9B9A97] mr-2 flex-shrink-0" />
            <span
              className={`${
                !value ? "text-[#787774] dark:text-[#9B9A97]" : "text-[#111111] dark:text-[#E8E8E7]"
              } truncate`}
            >
              {value}
            </span>
          </div>
          {!isDisabled &&
            (isOpen ? (
              <IoChevronUp className="text-[#787774] dark:text-[#9B9A97] flex-shrink-0 ml-1" />
            ) : (
              <IoChevronDown className="text-[#787774] dark:text-[#9B9A97] flex-shrink-0 ml-1" />
            ))}
        </div>

        {hasError && errorMessage && (
          <p className="mt-11 text-red-500 text-sm error-message">
            {errorMessage}
          </p>
        )}

        {isOpen && (
          <div className="absolute z-20 mt-10 w-full bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] max-h-60 overflow-y-auto rounded-[6px]"
               style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropdown;
