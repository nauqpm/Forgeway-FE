import { IoChevronDown, IoChevronUp, IoLocationOutline } from "react-icons/io5";
import { DropdownProps } from "@/common/components/address/types/location";

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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative h-[40px]">
        <div
          className={`absolute inset-0 py-2 px-3 flex justify-between items-center border
            ${hasError ? "border-red-500" : "border-gray-300"}
            bg-white rounded-sm
            ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={isDisabled ? undefined : onToggle}
        >
          <div className="flex items-center overflow-hidden">
            <IoLocationOutline className="text-gray-500 mr-2 flex-shrink-0" />
            <span
              className={`${
                !value ? "text-gray-500" : "text-gray-800"
              } truncate`}
            >
              {value}
            </span>
          </div>
          {!isDisabled &&
            (isOpen ? (
              <IoChevronUp className="text-gray-500 flex-shrink-0 ml-1" />
            ) : (
              <IoChevronDown className="text-gray-500 flex-shrink-0 ml-1" />
            ))}
        </div>

        {hasError && errorMessage && (
          <p className="mt-11 text-red-500 text-sm error-message">
            {errorMessage}
          </p>
        )}

        {isOpen && (
          <div className="absolute z-20 mt-[40px] w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto rounded-sm">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropdown;
