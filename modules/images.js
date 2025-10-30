const imageUrl = [
    "https://images.unsplash.com/photo-1503264116251-35a269479413",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94",
]

function getRandomImageUrl() {
    const randomIndex = Math.floor(Math.random() * imageUrl.length);
    return imageUrl[randomIndex];
}


module.exports = { getRandomImageUrl };
