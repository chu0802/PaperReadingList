# Paper Reading List

A web application for filtering and browsing academic papers. This project provides a clean interface to view, organize, and discover research papers with personalized recommendations.

## Features

- 📚 Browse collected academic papers
- 🎯 View personalized paper recommendations
- 🎨 Clean, responsive web interface
- 🔍 Filter and search through your paper collection

## Project Structure

```
PaperReadingList/
├── index.html              # Main web interface
├── assets/
│   ├── script.js          # Frontend JavaScript logic
│   └── styles.css         # Styling
└── data/
    └── collected_papers.json      # Your collected papers
```

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chu0802/PaperReadingList.git
cd PaperReadingList
```

2. Prepare your paper data in the required format (see [Data Format](#data-format) below)

### Usage

Simply open `index.html` in your web browser to view the interface. The application will automatically load papers from:
- `data/collected_papers.json` - Your saved papers

## Data Format

The application expects paper data in JSON format. Each paper should be stored as an object with the following structure:

```json
{
  "paper_id": {
    "paper_id": 374149,
    "arxiv_id": "2003.00425",
    "title": "Learning When and Where to Zoom With Deep Reinforcement Learning",
    "authors": "Burak Uzkent, Stefano Ermon",
    "published_date": "2020-03-01T00:00:00",
    "color": [0.889305032, 0.5666685923, 0.5441761394, 0.3],
    "ranking_score": 0.710558591,
    "rating": 1,
    "total_likes": 1,
    "total_read": 1,
    "venue": {
      "name": "CVPR 2020",
      "color": "#ebe3f4"
    },
    "year": {
      "name": "2020",
      "color": "#ddebf4"
    },
    "url": "https://openaccess.thecvf.com/content_CVPR_2020/papers/...",
    "relevance": 0.4211171819999999,
    "collections": [
      {
        "name": "Adaptive Computation",
        "color": "#f0ecf8"
      }
    ]
  }
}
```

**Note:** You need to provide your own paper data in the specified format. Place your JSON files in the `data/` directory following the structure above.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.