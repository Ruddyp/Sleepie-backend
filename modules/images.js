const imageUrl = [
    "https://images.unsplash.com/photo-1503264116251-35a269479413",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94",
    "https://images.unsplash.com/photo-1526779259212-939e64788e3c",
    "https://images.unsplash.com/photo-1552083375-1447ce886485",
    "https://images.unsplash.com/photo-1619033742043-b9a1adf35b30",
    "https://images.unsplash.com/photo-1546587348-d12660c30c50",
    "https://images.unsplash.com/photo-1668350965114-c366c30cfb13",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
];

function getRandomImageUrl() {
    const randomIndex = Math.floor(Math.random() * imageUrl.length);
    return imageUrl[randomIndex];
}


module.exports = { getRandomImageUrl };
