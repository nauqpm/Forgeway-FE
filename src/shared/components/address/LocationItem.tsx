import { LocationItemProps } from "./types/location";

const LocationItem = ({ name, onClick }: LocationItemProps) => {
  return (
    <div className="p-3 hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#111111] dark:text-[#E8E8E7] cursor-pointer" onClick={onClick}>
      {name}
    </div>
  );
};

export default LocationItem;
