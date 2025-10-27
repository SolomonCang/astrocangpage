// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/miniTools/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/miniTools/blog/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/miniTools/cv/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "A full publication list can be found in my ADS libarary",
          section: "Navigation",
          handler: () => {
            window.location.href = "/miniTools/publications/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "Some featured Github repositories used in my work",
          section: "Navigation",
          handler: () => {
            window.location.href = "/miniTools/repositories/";
          },
        },{id: "dropdown-spectrum-viewer",
              title: "Spectrum Viewer",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/miniTools/miniTools/spectrum-viewer/";
              },
            },{id: "dropdown-irap",
              title: "IRAP",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://www.irap.omp.eu";
              },
            },{id: "dropdown-bnu",
              title: "BNU",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://www.bnu.edu.cn";
              },
            },{id: "dropdown-polarbase",
              title: "Polarbase",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://www.polarbase.ovgso.fr";
              },
            },{id: "dropdown-eso-archive",
              title: "ESO archive",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://archive.eso.org/scienceportal/home";
              },
            },{id: "dropdown-scix",
              title: "SciX",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://scixplorer.org";
              },
            },{id: "dropdown-simbad",
              title: "Simbad",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://simbad.cds.unistra.fr/simbad/";
              },
            },{id: "post-a-table-of-observational-chromospheric-emission-lines",
        
          title: "A table of observational chromospheric emission lines",
        
        description: "chromospheric line list for low-mass stars",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/miniTools/blog/2025/line/";
          
        },
      },{id: "news-using-radio-observations-of-fast-we-detected-a-new-millisecond-scale-radio-burst-on-the-m-type-star-ad-leo-the-signal-originates-from-small-scale-magnetic-fields-in-the-stellar-spotted-regions-the-relevant-work-was-recently-published-in-science-advances-a-related-news-can-be-see-here-in-chinese",
          title: 'Using radio observations of FAST, we detected a new millisecond-scale radio burst on...',
          description: "",
          section: "News",},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%73%74%72%6F%63%61%6E%67@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-orcid',
        title: 'ORCID',
        section: 'Socials',
        handler: () => {
          window.open("https://orcid.org/0000-0003-3816-7335", "_blank");
        },
      },{
        id: 'social-ads',
        title: 'Ads',
        section: 'Socials',
        handler: () => {
          window.open("", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
