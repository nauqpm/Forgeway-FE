import { LocationListProps } from "@/common/components/address/types/location";
import LocationItem from "./LocationItem";
import { removeVietnameseDiacritics } from "./utils/utils";

const LocationList = ({
  items,
  onSelect,
  loading,
  searchTerm,
}: LocationListProps) => {
  const filteredItems = items.filter((item) => {
    const itemName = item.name.toLowerCase();
    const itemNameNoAccent = removeVietnameseDiacritics(itemName);
    const searchTermLower = searchTerm.toLowerCase();
    const searchTermNoAccent = removeVietnameseDiacritics(searchTermLower);

    return (
      itemName.includes(searchTermLower) ||
      itemNameNoAccent.includes(searchTermNoAccent)
    );
  });

  if (loading) {
    return <div className="p-3 text-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Loading...</div>;
  }

  if (filteredItems.length === 0) {
    return (
      <div className="p-3 text-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
        No results
      </div>
    );
  }

  return (
    <>
      {filteredItems.map((item) => (
        <LocationItem
          key={item.code}
          code={item.code}
          name={item.name}
          onClick={() => onSelect(item.code, item.name)}
        />
      ))}
    </>
  );
};

export default LocationList;
