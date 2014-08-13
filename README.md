Looper.js
=================

Cycle through your content without writing a single line of Javascript. To keep things simple, transition effects are optional and have been limited to slide and cross-fade. In browsers that don't support CSS transitions, jQuery's animate is used.

To get started, read the docs: http://rygine.com/projects/looper.js/docs/

Key Features
--------------------

* No coding required
* Fully accessible with ARIA attributes, tab focus and keyboard navigation
* LESS support with configuration variables
* Easily extensible through events

Known Browser Compatibility
--------------------

* IE 8+
* Chrome
* Firefox
* Safari

To Do
--------------------

* More advanced examples
* Add SASS support
* Write unit tests

Release Notes
--------------------

1.1.6
* Moved css/looper.css to src/looper.css

1.1.5
* Removed outline on focus in LESS
* Addressed issue #3
* Addressed issue #4
* Added changes from issue #5 pull request
* Cleaned up code style

1.1.2
* Fixed issue with loop not starting if no interval is set

1.1.1
* Changed plugin name to Looper.js to avoid confusion with other plugins
* Event names have been changed accordingly 'cycle' -> 'show' and 'cycled' -> 'shown'

1.1.0
* Added ARIA support with keyboard navigation
* Refactored cycle.less, now includes variables for easy configuration

1.0.6
* Minor fixes

1.0.0
* Initial release

Copyright and License
---------------------

Copyright 2013 Ry Racherbaumer

This software is licensed under the Apache License, Version 2.0 (the "Apache License") or the GNU 
General Public License version 2 (the "GPL License"). You may choose either license to govern your 
use of this software only upon the condition that you accept all of the terms of either the Apache 
License or the GPL License. 

You may obtain a copy of the Apache License and the GPL License in the LICENSE file, or at:

http://www.apache.org/licenses/LICENSE-2.0
http://www.gnu.org/licenses/gpl-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the Apache License 
or the GPL Licesnse is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, 
either express or implied. See the Apache License and the GPL License for the specific language governing 
permissions and limitations under the Apache License and the GPL License.
