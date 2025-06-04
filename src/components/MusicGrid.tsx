
import MusicCard from "./MusicCard";

const MusicGrid = () => {
  const musicData = [
    {
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
      category: "Rock",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      views: 45230
    },
    {
      title: "The Sound of Silence",
      artist: "Simon & Garfunkel",
      category: "Folk",
      image: "https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=300&h=300&fit=crop",
      views: 32100
    },
    {
      title: "Garota de Ipanema",
      artist: "Tom Jobim",
      category: "MPB",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
      views: 28900
    },
    {
      title: "Yesterday",
      artist: "The Beatles",
      category: "Pop",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      views: 51200
    },
    {
      title: "Águas de Março",
      artist: "Elis Regina",
      category: "MPB",
      image: "https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=300&h=300&fit=crop",
      views: 19800
    },
    {
      title: "Comfortably Numb",
      artist: "Pink Floyd",
      category: "Rock",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
      views: 38500
    },
    {
      title: "Hallelujah",
      artist: "Leonard Cohen",
      category: "Folk",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      views: 42300
    },
    {
      title: "Billie Jean",
      artist: "Michael Jackson",
      category: "Pop",
      image: "https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=300&h=300&fit=crop",
      views: 67800
    }
  ];

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
          <p className="text-sm sm:text-base text-gray-600">Descobrir letras e versões da sua música favorita</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {musicData.map((music, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <MusicCard {...music} />
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <button className="px-6 sm:px-8 py-2 sm:py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors duration-200 text-sm sm:text-base">
            Carregar Mais Músicas
          </button>
        </div>
      </div>
    </section>
  );
};

export default MusicGrid;
