// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "A full publication list can be found in my ADS libarary",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "Edit the `_data/repositories.yml` and change the `github_users` and `github_repos` lists to include your own GitHub profile and repositories.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "Tianqi Cang is now an assistant researcher of astrophysics at the Beijing Planetarium. He got his undergraduate degree in astronomy from Beijing Normal University (BNU) and received his PhD from Université de Toulouse/Institut de Recherche en Astrophysique et Planétologie in 2021. After that, He was a post-doc at BNU as an LAMOST fellow. He is interested in the magnetic field-driven stellar activity and its impact on the habitability of exoplanets.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
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
            },{id: "post-a-table-of-observational-chromospheric-emission-lines",
        
          title: "A table of observational chromospheric emission lines",
        
        description: "chromospheric line list for low-mass stars",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/line/";
          
        },
      },{id: "news-m-dwarf-ad-leo-was-observed-with-fast-the-full-paper-can-be-found-here-the-related-news-can-be-see-here-in-chinese",
          title: 'M-dwarf AD Leo was observed with FAST. The full paper can be found...',
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
