/* Helpers */
Element.prototype.prependChild = function (child) {
	return this.insertBefore(child, this.firstChild);
};

Element.prototype.insertAfter = function (newNode, referenceNode) {
	return referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

var toArray = function (obj) {
	if (!obj) {
		return [];
	}
	return Array.prototype.slice.call(obj);
};

var calculateBrightness = function (color) {
	return color.reduce(function (p, c) {
		return p + parseInt(c, 10);
	}, 0) / 3;
};


/* Define UWP namespace */
var UWP = {
	/* Default config */
	config: {
		pageTitle: 'UWP web framework',
		layoutType: 'overlay',
	},

	/* Main init function */
	init() {
		console.log('UWP.init()');

		/* Define main elements */
		UWP.head = document.head;
		UWP.body = document.body;

		UWP.pageTitle = document.createElement('h1');
		document.body.appendChild(UWP.pageTitle);

		UWP.header = document.createElement('header');
		document.body.appendChild(UWP.header);
		UWP.main = document.createElement('main');
		document.body.appendChild(UWP.main);

		/* Gets user-set config */
		UWP.getConfig();

		/* Set page title */
		UWP.pageTitle = UWP.config.pageTitle;

		/* Define additional variables */
		UWP.header.type = UWP.config.layoutType;
		UWP.body.setAttribute('data-layoutType', UWP.header.type);

		/* Handles clicking internal links */
		UWP.body.addEventListener('click', function (event) {
			if (event.target.getAttribute('data-target') !== null) {
				event.preventDefault();

				UWP.navigate(event.target.getAttribute('data-target'));
			}
		});

		/* Gets navigation */
		UWP.getNavigation();

		/* Creates custom styles */
		UWP.createStyles();

		/* Handles navigation between pages */
		UWP.navigate(window.location.hash.split('=')[1], false);
		window.onhashchange = function () {
			UWP.navigate(window.location.hash.split('=')[1], false);
		};

		/* Prepares space for document's title, puts it in place */
		UWP.pageTitle = document.createElement('span');
		UWP.header.prependChild(UWP.pageTitle);
	},

	/* Gets document's navigation, puts it in place */
	getConfig() {
		console.log('UWP.getConfig()');

		var URL = 'config/config.xml';

		var UWP_config_request = new XMLHttpRequest();
		UWP_config_request.onreadystatechange = function () {
			if (UWP_config_request.readyState === 4) {
				if (UWP_config_request.status === 200) {
					if (UWP_config_request.responseXML) {
						var config = UWP_config_request.responseXML.querySelector('config');
						var pageTitleSource = config.querySelector('pageTitle');
						var layoutTypeSource = config.querySelector('layoutType');
						var mainColor = config.querySelector('mainColor');
						var activeColor = config.querySelector('activeColor');

						if (pageTitleSource) {
							UWP.config.pageTitle = document.title = pageTitleSource.textContent;
						}

						if (layoutTypeSource) {
							UWP.config.layoutType = layoutTypeSource.textContent;
						}

						if (mainColor) {
							UWP.config.mainColor = mainColor.textContent;
						}

						if (activeColor) {
							UWP.config.activeColor = activeColor.textContent;
						}
					}
					else {
						console.error('Invalid response.');
					}
				}
				else {
					console.error('Failed to retrieve config file.');
				}
			}
		};
		UWP_config_request.open('GET', URL, false);
		UWP_config_request.send(null);
	},

	/* Gets document's navigation, puts it in place */
	getNavigation(target) {
		console.log('UWP.getNavigation()');

		if (typeof target === 'undefined') {
			target = 'default';
		}

		function parseNavElement(el) {
			var navLabel = el.querySelector('label').textContent;
			var navTarget = el.querySelector('target').textContent;
			var navIconSource = el.querySelector('icon');

			var navElement = document.createElement('li');

			var navLink = document.createElement('a');
			navLink.href = '#';
			navLink.title = navLabel;
			navLink.innerHTML = navLabel;
			if (navIconSource) {
				var navIcon = document.createElement('span');

				/* If that's a file, we'll create an img object with src pointed to it */
				if (/\.(jpg|png|gif|svg)/.test(navIconSource.textContent)) {
					var navIconImage = document.createElement('img');
					navIconImage.src = navIconSource.textContent;
					navIcon.appendChild(navIconImage);
				}
				/* ...otherwise, it must be Segoe MDL2 symbol */
				else {
					navIcon.innerHTML = navIconSource.textContent;
				}

				navLink.prependChild(navIcon);
			}
			navLink.addEventListener('click', function (event) {
				event.preventDefault();

				UWP.menuList.classList.remove('active');

				UWP.navigate(navTarget);
			});
			navLink.setAttribute('data-target', navTarget);

			navElement.appendChild(navLink);

			return navElement;
		}

		var URL = `nav/${target}.xml`;

		var UWP_navigation_request = new XMLHttpRequest();
		UWP_navigation_request.onreadystatechange = function () {
			if (UWP_navigation_request.readyState === 4) {
				if (UWP_navigation_request.status === 200) {
					if (UWP_navigation_request.responseXML) {
						var navsSource = UWP_navigation_request.responseXML.querySelector('mainMenu');

						UWP.nav = document.createElement('nav');

						/* Adds all the navigations to the DOM tree */
						toArray(navsSource.querySelectorAll('list')).forEach(function (navSource) {
							var navMain = document.createElement('ul');
							UWP.nav.appendChild(navMain);

							toArray(navSource.querySelectorAll('el')).forEach(function (el) {
								navMain.appendChild(parseNavElement(el));
							});
						});

						/* If navigation was constructed, adds it to the DOM tree and displays menu button */
						if (toArray(navsSource.querySelectorAll('list')).length) {
							UWP.header.appendChild(UWP.nav);
							UWP.addMenuButton();
						}
					}
					else {
						console.error('Invalid response.');
					}
				}
				else {
					console.error('Failed to retrieve navigation file.');
				}
			}
		};
		UWP_navigation_request.open('GET', URL, true);
		UWP_navigation_request.send(null);
	},

	/* Highlights current page in navigation */
	updateNavigation() {
		console.log('UWP.updateNavigation()');

		toArray(document.querySelectorAll('nav a')).forEach(function (link) {
			if (link.getAttribute('data-target') === UWP.config.currentPage) {
				link.parentElement.classList.add('active');
			}
			else {
				link.parentElement.classList.remove('active');
			}
		});
	},

	/* Creates custom styles based on config */
	createStyles() {
		console.log('UWP.createStyles()');

		UWP.customStyle = document.createElement('style');

		if (UWP.config.mainColor) {
			var mainColor_RGB =
				UWP.config.mainColor.match(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);

			if (mainColor_RGB) {
				mainColor_RGB = mainColor_RGB.slice(1);

				var mainColor_brightness = calculateBrightness(mainColor_RGB);

				if (mainColor_brightness >= 128) {
					UWP.body.classList.add('theme-light');
				}
				else {
					UWP.body.classList.add('theme-dark');
				}

				var mainColorDarkened = mainColor_RGB.map(function (color) {
					var newColor = color - 20;
					if (newColor < 0) newColor = 0;
					return newColor;
				});

				UWP.config.mainColorDarkened = `rgb(${mainColorDarkened})`;
			}

			UWP.customStyle.innerHTML += `
				[data-layoutType="tabs"] header {
					background: ${UWP.config.mainColor};
				}
				[data-layoutType="overlay"] header {
					background: ${UWP.config.mainColor};
				}
					[data-layoutType="overlay"] header nav:nth-of-type(1) {
					background-color: ${UWP.config.mainColor}; // @TODO: Darkened?
					}
				[data-layoutType="docked-minimized"] header {
					background: ${UWP.config.mainColor};
				}
					[data-layoutType="docked-minimized"] header nav:nth-of-type(1) {
						background: ${UWP.config.mainColor}; // @TODO: Darkened?
					}
				[data-layoutType="docked"] header {
					background: ${UWP.config.mainColor};
				}
					[data-layoutType="docked"] header nav:nth-of-type(1) {
						background: ${UWP.config.mainColor}; // @TODO: Darkened?
					}
			`;
		}

		if (UWP.config.activeColor) {
			var activeColor_RGB =
				UWP.config.activeColor.match(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);

			if (activeColor_RGB) {
				activeColor_RGB = activeColor_RGB.slice(1);

				var activeColor_brightness = calculateBrightness(activeColor_RGB);

				if (activeColor_brightness >= 128) {
					UWP.body.classList.add('active-light');
				}
				else {
					UWP.body.classList.add('active-dark');
				}
			}

			UWP.customStyle.innerHTML += `
				[data-layoutType="tabs"] header nav:nth-of-type(1) ul li.active {
					color: ${UWP.config.activeColor};
					border-bottom-color: ${UWP.config.activeColor};
				}
				[data-layoutType="overlay"] header nav:nth-of-type(1) ul li.active {
					background-color: ${UWP.config.activeColor};
				}
				[data-layoutType="docked-minimized"] header nav:nth-of-type(1) ul li.active {
					background-color: ${UWP.config.activeColor};
				}
				[data-layoutType="docked"] header nav:nth-of-type(1) ul li.active {
					background-color: ${UWP.config.activeColor};
				}
			`;
		}

		if (UWP.customStyle.innerHTML.length) {
			UWP.body.appendChild(UWP.customStyle);
		}
	},

	/* Puts a menu button in title bar */
	addMenuButton() {
		console.log('UWP.addMenuButton()');

		UWP.menuButton = document.createElement('button');
		UWP.menuButton.innerHTML = '&#xE700;';
		UWP.menuButton.setAttribute('aria-label', 'Menu');

		UWP.menuList = UWP.header.querySelector('header nav');

		UWP.menuButton.addEventListener('click', function () {
			UWP.menuList.classList.toggle('active');
		});

		UWP.main.addEventListener('click', function () {
			UWP.menuList.classList.remove('active');
		});

		UWP.header.prependChild(UWP.menuButton);
	},

	/* Puts content in place */
	navigate(target, addHistory) {
		console.log('UWP.navigate()');

		if (typeof target === 'undefined') {
			target = 'default';
		}

		UWP.config.currentPage = target;

		/* Pushes history state */
		if (addHistory) {
			history.pushState('', '', `${window.location.href.split('#')[0]}#page=${target}`);
		}

		/* Clears the page content */
		UWP.main.classList.remove('error');
		UWP.main.innerHTML = '';

		/* Displays error message */
		function displayError(title) {
			UWP.main.classList.add('error');
			UWP.main.innerHTML = `
				<div class="error-container">
					<h3>${title}</h3>
					<p>Ready for an adventure?</p>
					<p><a href="#">Try again</a>
				</div>
			`;
			UWP.main.querySelector('a').addEventListener('click', function (event) {
				event.preventDefault();

				UWP.navigate(target);
			});

			UWP.updateNavigation();
		}

		var URL = `pages/${target}.xml`;

		/* Requests page data */
		var UWP_navigate_request = new XMLHttpRequest();
		UWP_navigate_request.onreadystatechange = function () {
			if (UWP_navigate_request.readyState === 4) {
				if (UWP_navigate_request.status === 200) {
					if (UWP_navigate_request.responseXML) {
						var page = UWP_navigate_request.responseXML.querySelector('page');

						if (!page) {
							console.error('Something went wrong');

							displayError();
						}

						var pageTitle = page.querySelector('title').textContent;
						var pageBody =
							toArray(page.querySelector('body').childNodes)
							.filter(function (childNode) {
								return childNode.nodeType === 4;
							})[0]
							.data;
						var pageIncludeScript = page.querySelector('includeScript');

						/* Puts the new content in place */
						UWP.main.innerHTML = pageBody;

						UWP.main.classList.remove('start-animation');
						UWP.main.offsetWidth = UWP.main.offsetWidth;
						UWP.main.classList.add('start-animation');

						/* Puts the new page title in place */
						UWP.pageTitle.innerHTML = pageTitle;
						document.title = `${pageTitle} - ${UWP.config.pageTitle}`;

						/* Runs defined script */
						if (pageIncludeScript) {
							var scriptName = pageIncludeScript.textContent;
							// @TODO: Check if the script has already been loaded
							// @TODO: Create init() and run() functions inside the script, call them from here
							var script = document.createElement('script');
							script.src = `static/js/${scriptName}`;
							UWP.body.appendChild(script);
						}

						UWP.updateNavigation();
					}
					else {
						console.error('Something went wrong');

						displayError();
					}
				}
				else {
					console.error('Failed to retrieve the requested page.');

					displayError('Check connection');
				}
			}
		};
		UWP_navigate_request.open('GET', URL, true);
		try {
			UWP_navigate_request.send(null);
		}
		catch (err) {
			displayError('Something went wrong');
		}
	},
};
