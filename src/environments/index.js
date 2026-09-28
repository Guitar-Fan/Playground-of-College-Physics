const definitions = {
  earth: {
    id: 'earth',
    name: 'Earth',
    gravity: 9.81,
    atmosphere: true,
    ground: true,
    theme: {
      skyTop: '#8ec5df',
      skyBottom: '#f7d9a2',
      ground: '#315c45',
      accent: '#e05d44',
      stars: false,
    },
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    gravity: 3.71,
    atmosphere: true,
    ground: true,
    theme: {
      skyTop: '#5b3440',
      skyBottom: '#d47a54',
      ground: '#713d35',
      accent: '#f3c178',
      stars: false,
    },
  },
  space: {
    id: 'space',
    name: 'Deep Space',
    gravity: 0,
    atmosphere: false,
    ground: false,
    theme: {
      skyTop: '#08152b',
      skyBottom: '#172a48',
      ground: '#172a48',
      accent: '#8fe3cf',
      stars: true,
    },
  },
};

export function getEnvironment(id) {
  return definitions[id] ?? definitions.earth;
}

export function getEnvironments() {
  return Object.values(definitions);
}
