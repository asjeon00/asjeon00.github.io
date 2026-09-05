export interface ProjectImage {
  url: string;
  label: string;
  aspectRatio?: string;
}

export interface ProjectData {
  id: string;
  beadIndex: number;
  title: string;
  link: string;
  subtitle?: string;
  date: string;
  year?: string;
  passage: string;
  badukCoord: {
    row: number;
    col: number;
    label: string;
  };
  tags: string[];
  images: ProjectImage[];
}

/**
 * 8 Projects arranged strictly in chronological order by date:
 * Oldest (Top-Left) to Most Recent (Bottom):
 * 0: BLS Clone       (1/24/26)    [-dx, dy]  Top-Left
 * 1: Yukon           (2/22/2026)  [0, dy]    Top-Center
 * 2: halfpast*noon   (2/24/26)    [dx, dy]   Top-Right
 * 3: Kodak           (3/28/2026)  [-dx, 0]   Middle-Left
 * 4: NewJeans        (4/27/2026)  [0, 0]     Center Tengen
 * 5: B-Side          (6/16/2026)  [dx, 0]    Middle-Right
 * 6: Aedena          (6/27/2026)  [-dx, -dy] Bottom-Left
 * 7: PawChart        (7/2/2026)   [0, -dy]   Bottom-Center
 */
export const PROJECTS_DATA: ProjectData[] = [
  {
    id: "blsclone",
    beadIndex: 0,
    title: "BLS Clone",
    link: "https://asjeon.vercel.app/blsclone",
    date: "1/24/26",
    passage: "BLSclone is a clone of Blacklead studio's previous portfolio page. As part of a challenge to reverse engineer and recreate the techniques used in the website, the project was completed within a session and served as my first experience working with 3D.",
    badukCoord: {
      row: 16,
      col: 4,
      label: "row 16 · col 4",
    },
    tags: ["3D Experience", "WebGL", "Reverse Engineering", "Portfolio"],
    images: [
      {
        url: "/projects/blsclone/blsclone.png",
        label: "Fluid Physics Simulation & Spatial Geometry",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "yukon",
    beadIndex: 1,
    title: "Yukon",
    link: "https://asjeon.vercel.app/yukon",
    date: "2/22/2026",
    passage: "Yukon is another artist page made for the artist Johnny Yukon, inspired by the heavy emphasis on visual imagery with references to movies and other music videos in his work. The website intends to improve on the design of the original website that was both static and lacked an effective method of presenting his music in a way that is accessible and engaging.",
    badukCoord: {
      row: 16,
      col: 10,
      label: "row 16 · col 10",
    },
    tags: ["Artist Website", "Music Experience", "Visual Media", "Engaging UI"],
    images: [
      {
        url: "/projects/yukon/yukon.png",
        label: "Harmonic Layout System & Spatial Surface",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "halfpastnoon",
    beadIndex: 2,
    title: "halfpast*noon",
    link: "https://halfpastnoon.framer.website/",
    date: "2/24/26",
    passage: "halfpast*noon is an online based publication centered around thoughtful dialogue about the NBA. These designs were created as part of specwork for a possible redesign of the website taking into account its place as an online magazine.",
    badukCoord: {
      row: 16,
      col: 16,
      label: "row 16 · col 16",
    },
    tags: ["Online Publication", "Editorial Specwork", "Magazine", "NBA Dialogue"],
    images: [
      {
        url: "/projects/halfpastnoon/thumbnail.png",
        label: "Plate I · Cover & High-Noon Shadow Cast",
        aspectRatio: "16 / 10",
      },
      {
        url: "/projects/halfpastnoon/hpn1.png",
        label: "Plate II · Monolithic Facade & Solar Zenith Angle",
        aspectRatio: "16 / 10",
      },
      {
        url: "/projects/halfpastnoon/hpn2.png",
        label: "Plate III · Typographic Grid Register & Detail Study",
        aspectRatio: "16 / 10",
      },
      {
        url: "/projects/halfpastnoon/hpn4.png",
        label: "Plate IV · Contrast Shading & Structural Mass",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "kodak",
    beadIndex: 3,
    title: "Kodak",
    link: "https://asjeon.vercel.app/kodak",
    date: "3/28/2026",
    passage: "Kodak is a mock e-commerce site for Kodak apparel, a sub-brand of Kodak that sells vintage and retro-inspired clothing and accessories that is popular in Korea but otherwise no well known globally. The main inspiration for this design was the strong branding exercises seen in Korean indie clothing stores. The design attempts to translate the tactile experience of film photography combining the legacy of Kodak as a film company into a digital interface and accessible consumer product through the use of unique animations and layouts.",
    badukCoord: {
      row: 10,
      col: 4,
      label: "row 10 · col 4",
    },
    tags: ["E-Commerce", "Branding", "Tactile UI", "Film Photography"],
    images: [
      {
        url: "/projects/kodak/kodak.png",
        label: "Spectral Halation & Photochemical Emulsion",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "newjeans",
    beadIndex: 4,
    title: "NewJeans",
    link: "https://asjeon.vercel.app/NewJeans",
    date: "4/27/2026",
    passage: "NewJeans is a concept site for the k-pop group, NewJeans. Based on the group's other web experiences that blend user interaction into the group's identity, I attempted to create a website that resembled other artists websites while trying to incorporate interaactions that feel nostalgic of older interfaces. Layering and texturing are used to evoke a physicality to the website to help it feel less digital and more like a collection of physical media.",
    badukCoord: {
      row: 10,
      col: 10,
      label: "row 10 · col 10 (Tengen)",
    },
    tags: ["Concept Site", "Physicality", "Y2K Nostalgia", "Layered Media"],
    images: [
      {
        url: "/projects/newjeans/newjeans.png",
        label: "Collage Interface & Kinetic Pop Identity",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "bside",
    beadIndex: 5,
    title: "B-Side",
    link: "https://bsiderecords.framer.website/",
    date: "6/16/2026",
    passage: "B-side records is a concept store completed as a design challenge for the Framer Agents hackathon. The interactive components like the grid were iterated on in an attempt to create a unique and engaging user experience that sets it apart from typical e-commerce sites. Design was heavily inspired by the editorial layouts of magazines and completed within 24 hours.",
    badukCoord: {
      row: 10,
      col: 16,
      label: "row 10 · col 16",
    },
    tags: ["Concept Store", "Framer Hackathon", "Magazine Editorial", "Grid UI"],
    images: [
      {
        url: "/projects/bside/image.png",
        label: "Acoustic Waveform Modulator & Refraction Stage",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "Aedena",
    beadIndex: 6,
    title: "Aedena",
    link: "https://moebius-desert.vercel.app/",
    date: "6/27/2026",
    passage: "Aedena is based on the work of Moebius, a famous French sci-fi illustrator. Completed as part of Threejs Journey's 24th Challenge - Stylized Nature.",
    badukCoord: {
      row: 4,
      col: 4,
      label: "row 4 · col 4",
    },
    tags: ["Three.js", "Stylized Nature", "Moebius", "Challenge 24"],
    images: [
      {
        url: "/projects/Aedena/thumbnail.png",
        label: "Plate I · Desert Monolith & Horizon Overview",
        aspectRatio: "16 / 10",
      },
      {
        url: "/projects/Aedena/image.png",
        label: "Plate II · Crystalline Architecture & Mineral Geometries",
        aspectRatio: "16 / 10",
      },
    ],
  },
  {
    id: "pawchart",
    beadIndex: 7,
    title: "PawChart",
    link: "https://pawchart.framer.website/",
    date: "7/2/2026",
    passage: "PawChart is a University of Pennsylvania-based startup centered around providing accesible information to both pet owners and vets. I was hire to redesign the product website in preparation for their launch. Implementation completed within Framer.",
    badukCoord: {
      row: 4,
      col: 10,
      label: "row 4 · col 10",
    },
    tags: ["Penn Startup", "Framer", "Product Redesign", "Vet Tech"],
    images: [
      {
        url: "/projects/pawchart/thumbnail.png",
        label: "Plate I · Clinical Telemetry Dashboard & Patient Monitor",
        aspectRatio: "16 / 10",
      },
      {
        url: "/projects/pawchart/image2.png",
        label: "Plate II · Real-Time Waveform Vectors & Diagnostic Analytics",
        aspectRatio: "16 / 10",
      },
    ],
  },
];
