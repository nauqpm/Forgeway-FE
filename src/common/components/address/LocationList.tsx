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
    return <div className="p-3 text-center text-gray-500">Đang tải...</div>;
  }

  if (filteredItems.length === 0) {
    return (
      <div className="p-3 text-center text-gray-500">
        Không tìm thấy kết quả
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
