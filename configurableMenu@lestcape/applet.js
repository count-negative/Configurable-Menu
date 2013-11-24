// Applet : Configurable Menu      Version      : v0.1-Beta
// O.S.   : Cinnamon               Release Date : 23 November 2013.
// Author : Lester Carballo Pérez  Email        : lestcape@gmail.com
//
// Website : https://github.com/lestcape/Configurable-Menu
//
// This is a frock of Main Cinnamon menu applet with more configurable options.
//
// Skills including:
//
//    1- Can be active OnButtonPress action instead of OnButtonRelease.
//    2- You can control the menu with scrolling the height.
//    3- Support for theme change.
//    4- Enable and disable favorites.
//    5- Separate power button of favorites.
//    6- And more for the future.
//
// This program is free software:
//
//    You can redistribute it and/or modify it under the terms of the
//    GNU General Public License as published by the Free Software
//    Foundation, either version 3 of the License, or (at your option)
//    any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.


/*
const GMenu = imports.gi.GMenu;

const Signals = imports.signals;
const FileUtils = imports.misc.fileUtils;
const Util = imports.misc.util;
const Tweener = imports.ui.tweener;


const Pango = imports.gi.Pango;

const ICON_SIZE = 16;
const CATEGORY_ICON_SIZE = 22;
const APPLICATION_ICON_SIZE = 22;
const MAX_RECENT_FILES = 20;

const USER_DESKTOP_PATH = FileUtils.getUserDesktopDir();


*/

/*

const DND = imports.ui.dnd;
*/
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Applet = imports.ui.applet;
const ScreenSaver = imports.misc.screenSaver;
const GnomeSession = imports.misc.gnomeSession;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
const DocInfo = imports.misc.docInfo;
const Lang = imports.lang;
const AppFavorites = imports.ui.appFavorites;
const GLib = imports.gi.GLib;

const AppletPath = imports.ui.appletManager.applets['configurableMenu@lestcape'];
const CinnamonMenu = AppletPath.cinnamonMenu;

let appsys = Cinnamon.AppSystem.get_default();
const MAX_FAV_ICON_SIZE = 32;
const HOVER_ICON_SIZE = 64;
/*
const LIB_PATH = '/usr/share/cinnamon/applets/menu@cinnamon.org';
imports.searchPath.unshift(LIB_PATH);
const CinnamonMenu = imports.applet;
*/

function TimeAndDate(){
    this._init();
}

TimeAndDate.prototype = {
   _init: function(metadata){	
      this.dateFormat = "%A,%e %B";
      this.dateSize = "6pt";
      this.timeFormat = "%H:%M";
      this.timeSize = "15pt";
      this.timeout = 0;

      this._clockContainer = new St.BoxLayout({vertical:true, style_class: 'clock-container'});	
      this._dateContainer =  new St.BoxLayout({vertical:false, style_class: 'date-container'});
      this._timeContainer =  new St.BoxLayout({vertical:false, style_class: 'time-container'});

      this._date = new St.Label();
      this._time = new St.Label();
      this._dateContainer.add(this._date);
      this._timeContainer.add(this._time);

      this._clockContainer.add(this._timeContainer, {x_fill: false, x_align: St.Align.MIDDLE});
      this._clockContainer.add(this._dateContainer, {x_fill: false, x_align: St.Align.MIDDLE});

      this.actor = this._clockContainer;
      this._date.style="font-size: " + this.dateSize;
      this._time.style="font-size: " + this.timeSize;
   },

   startTimer: function() {
      if(this.timeout == 0) {
         this.timeout = 1;
         this._updateDate();
      }
   },

   closeTimer: function() {
      if(this.timeout > 0)
         Mainloop.source_remove(this.timeout);
      this.timeout = 0;
   },

   setDateFormat: function(format) {
      this.dateFormat = format;
      this.refrech();
   },

   setTimeFormat: function(format) {
      this.timeFormat = format;
      this.refrech();
   },

   setDateSize: function(size) {
      this.dateSize = size + "pt";
      this._date.style="font-size: " + this.dateSize;
      this.refrech();
   },

   setTimeSize: function(size) {
      this.timeSize = size + "pt";
      this._time.style="font-size: " + this.timeSize;
      this.refrech();
   },

   setClockVisible: function(visible) {
      this._timeContainer.visible = visible;
      if(visible)
         this.startTimer();
      else
         this.closeTimer();
   },

   setDateVisible: function(visible) {
      this._dateContainer.visible = visible;
   },

   setAlign: function(align) {
      this._clockContainer.remove_actor(this._timeContainer);
      this._clockContainer.remove_actor(this._dateContainer);
      this._clockContainer.add(this._timeContainer, {x_fill: false, x_align: align});
      this._clockContainer.add(this._dateContainer, {x_fill: false, x_align: align});
      this.refrech();
   },

   refrech: function() {
      let displayDate = new Date();
      this._time.set_text(displayDate.toLocaleFormat(this.timeFormat));
      this._date.set_text(displayDate.toLocaleFormat(this.dateFormat));
   },
   _updateDate: function() {
      // let timeFormat = '%H:%M';
      // let dateFormat = '%A,%e %B';
      this.refrech();
      if(this.timeout > 0)
         this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateDate));
   }
};


function HoverIcon() {
    this._init();
}

HoverIcon.prototype = {
   _init: function () {
      try {
         this.face = new Gio.FileIcon({ file: Gio.file_new_for_path(GLib.get_home_dir() + '/.face')});
         this.actor = new St.Bin();
         this.icon = new St.Icon({
            icon_size: HOVER_ICON_SIZE,
            icon_type: St.IconType.FULLCOLOR
         });
         this.actor.child = this.icon;
         this.refreshFace();
      } catch(e) {
         Main.notifyError("Error:",e.message);
      }
   },

   refresh: function (icon) {
      this.icon.set_icon_name(icon);
   },

   refreshFace: function () {
      this.icon.set_gicon(this.face);
   }
//let networkIcon = networkApp.create_icon_texture(PLACES_ICON_SIZE);
 //this._refresh('folder-home');
//this.hoverIcon._refresh('system-log-out');
//this.hoverIcon._refresh('screensaver');
//folder-documents
//folder-pictures
//folder-music
//folder-videos
//computer
//gnome-control-center
//cinnamon-settings
//synaptic
//update-manager
//terminal
//help
//system-shutdown
//gconf-editor
};

function SystemButton(appsMenuButton, icon, nbFavorites, title, description) {
    this._init(appsMenuButton, icon, nbFavorites, title, description);
}

SystemButton.prototype = {
   _init: function(appsMenuButton, icon, nbFavorites, title, description) {
      this.actor = new St.Button({ reactive: true, style_class: 'menu-favorites-button' });
      this.icon = icon;
      this.title = title;
      this.description = description;
      this.actionCallBack = null;
      this.active = false;     
      let monitorHeight = Main.layoutManager.primaryMonitor.height;
      let real_size = (0.7*monitorHeight) / nbFavorites;
      let icon_size = 0.6*real_size;
      if (icon_size>MAX_FAV_ICON_SIZE) icon_size = MAX_FAV_ICON_SIZE;
      this.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(2)+"px;padding-right: "+(2)+"px;margin:auto;";
      let iconObj = new St.Icon({icon_name: icon, icon_size: icon_size, icon_type: St.IconType.FULLCOLOR});
      this.actor.set_child(iconObj);
      //this.actor.connect()
      iconObj.realize()
   },

   setAction: function(actionCallBack) {
      this.actionCallBack = actionCallBack;
      this.actor.connect('clicked', actionCallBack);
   },

   executeAction: function() {
      if(this.actionCallBack)
         this.actionCallBack();
   },

   setActive: function(active) {
      this.active = active;
      if(this.active)//
         this.actor.set_style_class_name('menu-category-button-selected');
      else {
         this.actor.set_style_class_name('menu-favorites-button');
      }
   }
};
/*
function FavoritesButton(appsMenuButton, app, nbFavorites) {
    this._init(appsMenuButton, app, nbFavorites);
}

FavoritesButton.prototype = {
    __proto__: CinnamonMenu.GenericApplicationButton.prototype,
    
    _init: function(appsMenuButton, app, nbFavorites) {
        CinnamonMenu.GenericApplicationButton.prototype._init.call(this, appsMenuButton, app);        
        let monitorHeight = Main.layoutManager.primaryMonitor.height;
        let real_size = (0.7*monitorHeight) / nbFavorites;
        let icon_size = 0.6*real_size;
        if (icon_size>MAX_FAV_ICON_SIZE) icon_size = MAX_FAV_ICON_SIZE;
        this.actor.style = "padding-top: "+2+"px;padding-bottom: "+2+"px;padding-left: "+(2)+"px;padding-right: "+(2)+"px;margin:auto;";

        this.actor.add_style_class_name('menu-favorites-button');
        let icon = app.create_icon_texture(icon_size);
        this.addActor(icon);
        icon.realize()

        this._draggable = DND.makeDraggable(this.actor);     
        this.isDraggableApp = true;
    },
    
    get_app_id: function() {
        return this.app.get_id();
    },
    
    getDragActor: function() {
        return new Clutter.Clone({ source: this.actor });
    },

    // Returns the original actor that should align with the actor
    // we show as the item is being dragged.
    getDragActorSource: function() {
        return this.actor;
    }
};
*/
function MyApplet(orientation, panel_height, instance_id) {
   this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
   __proto__: CinnamonMenu.MyApplet.prototype,

   _init: function(orientation, panel_height, instance_id) {
      Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
      try {                    
         this.set_applet_tooltip(_("Menu"));
         this.orientation = orientation;
         this._searchIconClickedId = 0;
         this._applicationsButtons = new Array();
         this._applicationsButtonFromApp = new Object();
         this._favoritesButtons = new Array();
         this._placesButtons = new Array();
         this._transientButtons = new Array();
         this._recentButtons = new Array();
         this._categoryButtons = new Array();
         this._selectedItemIndex = null;
         this._previousTreeItemIndex = null;
         this._previousSelectedActor = null;
         this._previousVisibleIndex = null;
         this._previousTreeSelectedActor = null;
         this._activeContainer = null;
         this._activeActor = null;
         this._applicationsBoxWidth = 0;
         this.menuIsOpening = false;
         this.signalKeyPowerID = 0;
         this.showTime = false;
         this.timeFormat = "%H:%M";
         this.timeSize = 15;
         this.showDate = false;
         this.dateFormat = "%A,%e %B";
         this.dateSize = 6;
          
         this.RecentManager = new DocInfo.DocManager();

         this.menu = new Applet.AppletPopupMenu(this, orientation);
         this.menu.actor.add_style_class_name('menu-background');
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));

         this.menuManager = new PopupMenu.PopupMenuManager(this);
         this.menuManager.addMenu(this.menu);   

         this.actor.connect('key-press-event', Lang.bind(this, this._onSourceKeyPress));
         this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPressEvent));

         this.settings = new Settings.AppletSettings(this, "configurableMenu@lestcape", instance_id);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-recent", "showRecent", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-places", "showPlaces", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-hover", "activateOnHover", this._updateActivateOnHover, null);                        
         this.settings.bindProperty(Settings.BindingDirection.IN, "menu-icon", "menuIcon", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "menu-label", "menuLabel", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "search-filesystem", "searchFilesystem", null, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "hover-delay", "hover_delay_ms", this._update_hover_delay, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "enable-autoscroll", "autoscroll_enabled", this._update_autoscroll, null);

//My Setting
         this.settings.bindProperty(Settings.BindingDirection.IN, "theme", "theme", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-press", "activateOnPress", null, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-favorites", "showFavorites", this._setVisibleFavorites, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-hover-icon", "showHoverIcon", this._setVisibleHoverIcon, null);
         
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-time", "showTime", this._updateClock, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "time-format", "timeFormat", this._updateClock, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "time-size", "timeSize", this._updateClock, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-date", "showDate", this._updateDate, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "date-format", "dateFormat", this._updateDate, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "date-size", "dateSize", this._updateDate, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "controling-height", "controlingHeight", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "height", "height", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-favorites", "scrollFavoritesVisible", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-categories", "scrollCategoriesVisible", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-applications", "scrollApplicationsVisible", this._updateComplete, null);

         this._searchInactiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                  icon_name: 'edit-find',
                                                  icon_type: St.IconType.SYMBOLIC });
         this._searchActiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                icon_name: 'edit-clear',
                                                icon_type: St.IconType.SYMBOLIC });

         this._display();
         appsys.connect('installed-changed', Lang.bind(this, this._refreshApps));
         AppFavorites.getAppFavorites().connect('changed', Lang.bind(this, this._refreshFavs));

         global.display.connect('overlay-key', Lang.bind(this, function() {
            try {
               this.menu.toggle_with_options(false);
            }
            catch(e) {
               global.logError(e);
            }
         }));
         Main.placesManager.connect('places-updated', Lang.bind(this, this._refreshPlacesAndRecent));
         this.RecentManager.connect('changed', Lang.bind(this, this._refreshPlacesAndRecent));

         this._fileFolderAccessActive = false;

         this._pathCompleter = new Gio.FilenameCompleter();
         this._pathCompleter.set_dirs_only(false);
         this.lastAcResults = new Array();

         this._updateComplete();
      }
      catch (e) {
         Main.notify("Error:", e.message);
         global.logError(e);
      }
   },

   _onMenuKeyPress: function(actor, event) {
      try {
        let symbol = event.get_key_symbol();
        let item_actor;
        this.appBoxIter.reloadVisible();
        this.catBoxIter.reloadVisible();

        let keyCode = event.get_key_code();
        let modifierState = Cinnamon.get_event_state(event);

        /* check for a keybinding and quit early, otherwise we get a double hit
           of the keybinding callback */
        let action = global.display.get_keybinding_action(keyCode, modifierState);

        if (action == Meta.KeyBindingAction.CUSTOM) {
            return true;
        }

        if (global.display.get_is_overlay_key(keyCode, modifierState) && this.menu.isOpen) {
            this.menu.close();
            return true;
        }   

        if(actor._delegate instanceof CinnamonMenu.FavoritesButton) {
           this._navegateFavBox(symbol, actor);
           return false;
        } else if(actor == this.powerButtons) {
           this._navegateSysBox(symbol, actor);
           return false; 
        } else if(this._activeContainer === null) {
           item_actor = this._navegationInit(symbol);
        } else if(this._activeContainer==this.applicationsBox) {
           item_actor = this._navegateAppBox(symbol, this._selectedItemIndex);
        } else if(this._activeContainer==this.categoriesBox) {
           item_actor = this._navegateCatBox(symbol, this._selectedItemIndex);
        } else if (this.searchFilesystem && (this._fileFolderAccessActive || symbol == Clutter.slash)) {
           return this._searchFileSystem(symbol);
        }
        else {
            return false;
        }
        if (!item_actor || item_actor === this.searchEntry) {
            return false;
        }
        item_actor._delegate.emit('enter-event');
        return true;
      }
      catch(e) {
        Main.notify("Error", e.message);
      }
   },

   _searchFileSystem: function(symbol) {
      if(symbol == Clutter.Return || symbol == Clutter.KP_Enter) {
         if(this._run(this.searchEntry.get_text())) {
            this.menu.close();
         }
         return true;
      }
      else if(symbol == Clutter.slash) {
         // Need preload data before get completion. GFilenameCompleter load content of parent directory.
         // Parent directory for /usr/include/ is /usr/. So need to add fake name('a').
         let text = this.searchEntry.get_text().concat('/a');
         let prefix;
         if(text.lastIndexOf(' ') == -1)
            prefix = text;
         else
            prefix = text.substr(text.lastIndexOf(' ') + 1);
         this._getCompletion(prefix);

         return false;
      }
      else if(symbol == Clutter.Tab) {
         let text = actor.get_text();
         let prefix;
         if(text.lastIndexOf(' ') == -1)
            prefix = text;
         else
            prefix = text.substr(text.lastIndexOf(' ') + 1);
         let postfix = this._getCompletion(prefix);
         if(postfix != null && postfix.length > 0) {
            actor.insert_text(postfix, -1);
            actor.set_cursor_position(text.length + postfix.length);
            if(postfix[postfix.length - 1] == '/')
               this._getCompletion(text + postfix + 'a');
         }
         return true;
      }
      else if(symbol == Clutter.Escape) {
         this.searchEntry.set_text('');
         this._fileFolderAccessActive = false;
      }
      return false;
   },

   _navegationInit: function(symbol) {
      let index, item_actor;
      if(symbol == Clutter.KEY_Up) {
         this._activeContainer = this.applicationsBox;
         item_actor = this.appBoxIter.getLastVisible();
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
      } else if (symbol == Clutter.KEY_Down) {
         this._activeContainer = this.applicationsBox;
         item_actor = this.appBoxIter.getFirstVisible();
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateAppBox: function(symbol, index) {
      let item_actor;
      if(symbol == Clutter.KEY_Up) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
         item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      } 
      else if(symbol == Clutter.KEY_Down) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
         item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Left) {//&& !this.searchActive
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
         item_actor = (this._previousTreeSelectedActor != null) ? this._previousTreeSelectedActor : this.catBoxIter.getFirstVisible();
         index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._previousTreeSelectedActor = item_actor;
      } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         item_actor = this.applicationsBox.get_child_at_index(index);
         item_actor._delegate.activate();
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateCatBox: function(symbol, index) {
      let item_actor;
      if(symbol == Clutter.KEY_Up) {
         this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
         this._previousTreeSelectedActor._delegate.isHovered = false;
         item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
         index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButtonCategories(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Down) {
         this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
         this._previousTreeSelectedActor._delegate.isHovered = false;
         item_actor = this.catBoxIter.getNextVisible(this._activeActor)
         index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._previousTreeSelectedActor._delegate.emit('leave-event');
         this._scrollToButtonCategories(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Right) {// && (this._activeContainer !== this.applicationsBox)
         if(this._previousVisibleIndex !== null) {
            item_actor = this.appBoxIter.getVisibleItem(this._previousVisibleIndex);
         } else {
            item_actor = this.appBoxIter.getFirstVisible();
         }
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateFavBox: function(symbol, actor) {
      this.fav_actor = actor;
      let childrens = this.favoritesBox.get_children()[0].get_children();
      if(childrens.length > 0) {
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Right)) {
            if(childrens[0] == actor) {
               this.fav_actor = childrens[childrens.length -1];
            } else
               this.fav_actor = childrens[childrens.indexOf(actor) - 1];
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            this._scrollToButtonFav(this.fav_actor._delegate);
            return false;
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Left)) {
            if(childrens[childrens.length - 1] == actor) {
               this.fav_actor = childrens[0];
            } else
               this.fav_actor = childrens[childrens.indexOf(actor) + 1];
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            this._scrollToButtonFav(this.fav_actor._delegate);
            return false;
         }
         else if(symbol == Clutter.Tab) {
            global.stage.set_key_focus(this.searchEntry);
            Mainloop.idle_add(Lang.bind(this, function() {
               global.stage.set_key_focus(this.powerButtons);
            }));
         } else {
            global.stage.set_key_focus(this.powerButtons);
         }
         return false;
      }
   },

   _navegateSysBox: function(symbol, actor) {
      if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Right)) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         if(this.sysButtSelected + 1 < this._systemButtons.length)
            this.sysButtSelected++;
         else
            this.sysButtSelected = 0;
         this._systemButtons[this.sysButtSelected].setActive(true);
         if(symbol == Clutter.KEY_Up)
            Mainloop.idle_add(Lang.bind(this, function() {
               global.stage.set_key_focus(this.powerButtons);
            }));
      }
      else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Left)) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         if(this.sysButtSelected - 1 < 0)
            this.sysButtSelected = this._systemButtons.length -1;
         else
            this.sysButtSelected--;
         this._systemButtons[this.sysButtSelected].setActive(true);
      }
      else /*if(symbol == Clutter.Tab)*/ {
         this._systemButtons[this.sysButtSelected].setActive(false);
         //global.stage.set_key_focus(this.searchEntry);
      }
   },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
   },

   _scrollToButtonFav: function(button) {
      var current_scroll_value = this.favoritesScrollBox.get_vscroll_bar().get_adjustment().get_value();
      var box_height = this.favoritesScrollBox.get_allocation_box().y2-this.favoritesScrollBox.get_allocation_box().y1;
      var new_scroll_value = current_scroll_value;
      if (current_scroll_value > button.actor.get_allocation_box().y1-10) new_scroll_value = button.actor.get_allocation_box().y1-10;
      if (box_height+current_scroll_value < button.actor.get_allocation_box().y2+10) new_scroll_value = button.actor.get_allocation_box().y2-box_height+10;
      if (new_scroll_value!=current_scroll_value) this.favoritesScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
   },

   _scrollToButtonCategories: function(button) {
      var current_scroll_value = this.categoriesScrollBox.get_vscroll_bar().get_adjustment().get_value();
      var box_height = this.categoriesScrollBox.get_allocation_box().y2-this.categoriesScrollBox.get_allocation_box().y1;
      var new_scroll_value = current_scroll_value;
      if (current_scroll_value > button.actor.get_allocation_box().y1-10) new_scroll_value = button.actor.get_allocation_box().y1-10;
      if (box_height+current_scroll_value < button.actor.get_allocation_box().y2+10) new_scroll_value = button.actor.get_allocation_box().y2-box_height+10;
      if (new_scroll_value!=current_scroll_value) this.categoriesScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
   },

   _update_autoscroll: function() {
      this.applicationsScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
   },     

   _setVisibleFavorites: function() {
      this.favBoxWrapper.remove_actor(this.favoritesScrollBox);
      if(this.showFavorites) {
         //this.betterPanel.insert_actor(this.favoritesBox, 0);
         this.favBoxWrapper.insert_actor(this.favoritesScrollBox, 0);
         this._refreshFavs();
      }
   },

   _setVisibleHoverIcon: function() {
      let currentFather;
      switch(this.theme) {
         case "classic":
            currentFather = this.searchBox;
            break;
         case "stylized":
            currentFather = this.searchBox;
            break;
      }
      if(currentFather) {
         currentFather.remove_actor(this.hover.actor);
         if(this.showHoverIcon)
            currentFather.add(this.hover.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });
      }
   },

   _updateClock: function() {
      this.timeDate.setClockVisible(this.showTime);
      this.timeDate.setTimeFormat(this.timeFormat);
      this.timeDate.setTimeSize(this.timeSize);
   },

   _updateDate: function() {
      this.timeDate.setDateVisible(this.showDate);
      this.timeDate.setDateFormat(this.dateFormat);
      this.timeDate.setDateSize(this.dateSize);
   },

   _updateComplete: function() {
      this._updateMenuSection();
      this._display();
      this._setVisibleFavorites();
      this._setVisibleHoverIcon();
      this._updateClock();
      this._updateDate();
      this._update_autoscroll();
      this._refreshPlacesAndRecent();
      this._updateActivateOnHover();
      this._updateIconAndLabel();
      this._update_hover_delay();
   },

   _updateHeight: function() {
      if(this.controlingHeight) {
         let oldHeight = this.betterPanel.get_height();
         this.betterPanel.set_height(this.height);
         if(this.scrollFavoritesVisible)
            this.favBoxWrapper.set_height(-1);
         else
            this.favoritesBox.set_height(this.height - this._internalHeight(this.favBoxWrapper) + this.favoritesBox.get_height());
         if(this.scrollCategoriesVisible)
            this.categoriesBox.set_height(-1);
         else
            this.categoriesBox.set_height(this.height);
         if(this.scrollApplicationsVisible)
            this.applicationsBox.set_height(-1);
         else
            this.applicationsBox.set_height(this.height);
      }
      else {
         this.favBoxWrapper.set_height(-1);
         this.categoriesBox.set_height(-1);
         this.applicationsBox.set_height(-1);
         this.betterPanel.set_height(-1);
      }
   },

   _internalHeight: function(pane) {
      let actors = pane.get_children();
      let result = 0;
      for(var i=0; i<actors.length; i++) {
         result += actors[i].get_height();
      }
      return result;
   },

   _onButtonReleaseEvent: function(actor, event) {
      if(!this.activateOnPress)
         CinnamonMenu.MyApplet.prototype._onButtonReleaseEvent.call(this, actor, event);
   },

   _onButtonPressEvent: function(actor, event) {
      if((this.activateOnPress)&&(!global.settings.get_boolean("panel-edit-mode")))
         CinnamonMenu.MyApplet.prototype._onButtonReleaseEvent.call(this, actor, event);
   },

   _updateMenuSection: function() {
      if(this.menu) {
         this.menu.close();
         this.menu.destroy();
         this.menu = new Applet.AppletPopupMenu(this, this.orientation);
         this.menuManager.addMenu(this.menu);
        
         this.menu.actor.add_style_class_name('menu-background');
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
      }
   },

   _createVerticalScroll: function() {
      let scrollBox = new St.ScrollView({ x_fill: true, y_fill: false, y_align: St.Align.START, style_class: 'vfade menu-applications-scrollbox' });
      scrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
      let vscroll = scrollBox.get_vscroll_bar();
      vscroll.connect('scroll-start',
                       Lang.bind(this, function() {
                          this.menu.passEvents = true;
                       }));
      vscroll.connect('scroll-stop',
                       Lang.bind(this, function() {
                          this.menu.passEvents = false;
                       }));
      return scrollBox;
   },

   _display: function() {
     try {
        this._activeContainer = null;
        this._activeActor = null;
        this.vectorBox = null;
        this.actor_motion_id = 0;
        this.vector_update_loop = null;
        this.current_motion_actor = null;
        let section = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(section);     
        
        this._session = new GnomeSession.SessionManager();
        this._screenSaverProxy = new ScreenSaver.ScreenSaverProxy();
        this.timeDate = new TimeAndDate();

        switch(this.theme) {
           case "classic":
                          this.loadClassic(); 
                          break;
           case "stylized":
                          this.loadStylized(); 
                          break;
           default:
                          this.loadClassic(); 
                          break;
        }

        section.actor.add_actor(this.mainBox);
        section.actor.add_actor(this.endBox);

        Mainloop.idle_add(Lang.bind(this, function() {
            this._updateHeight();//Add by me
            this._clearAllSelections(true);
        }));
     } catch(e) {
        Main.notify("Error:", e.message);
     }
   },

   _refreshFavs: function() {
      //Remove all favorites
      this.favoritesBox.get_children().forEach(Lang.bind(this, function (child) {
          child.destroy();
      }));

      let favoritesBox = new CinnamonMenu.FavoritesBox();
      this.favoritesBox.add_actor(favoritesBox.actor);
         
      //Load favorites again
      this._favoritesButtons = new Array();
      let launchers = global.settings.get_strv('favorite-apps');
      let appSys = Cinnamon.AppSystem.get_default();
      let j = 0;
      for(let i = 0; i < launchers.length; ++i) {
         let app = appSys.lookup_app(launchers[i]);
         if(app) {
            let button = new CinnamonMenu.FavoritesButton(this, app, launchers.length); // + 3 because we're adding 3 system buttons at the bottom
            button.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(4)+"px;padding-right: "+(-5)+"px;margin:auto;";
            this._favoritesButtons[app] = button;
            favoritesBox.actor.add(button.actor, { x_align: St.Align.MIDDLE, y_fill: false });
            button.actor.connect('enter-event', Lang.bind(this, function() {
               this._clearPrevCatSelection();
               this.selectedAppTitle.set_text(button.app.get_name());
               if(button.app.get_description()) this.selectedAppDescription.set_text(button.app.get_description().split("\n")[0]);
                  else this.selectedAppDescription.set_text("");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
            }));
            button.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            ++j;
         }
      }
   },

   _powerButtons: function(verticalPane) {        
      //Separator
      /*if(launchers.length!=0){
         let separator = new PopupMenu.PopupSeparatorMenuItem();
         powerButton.add_actor(separator.actor, { y_align: St.Align.END, y_fill: false });                   
      }*/
      let powerButtons = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: verticalPane });
      this._systemButtons = new Array();
      powerButtons.connect('key-focus-in', Lang.bind(this, function(actor, event) {        
         try {
            if(this._systemButtons.length > 0) {
               if(!this.sysButtSelected)
                  this.sysButtSelected = 0;
               this._systemButtons[this.sysButtSelected].setActive(true);
               if(this.signalKeyPowerID == 0)
                  this.signalKeyPowerID = powerButtons.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            }
         } catch(e) {
            Main.notify("Error", e.message);
         }
      }));
      powerButtons.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         for(let cSys in this._systemButtons)
            this._systemButton[cSys].setActive(false);
         if(this.signalKeyPowerID > 0)
            powerButtons.disconnect(this.signalKeyPowerID);
      }));
      //Lock screen
      let button = new SystemButton(this, "gnome-lockscreen", 3, _("Lock screen"), _("Lock the screen"));
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));
      button.setAction(Lang.bind(this, this._onLockScreenAction));     
        
      powerButtons.add_actor(button.actor);
      this._systemButtons[0] = button;
        
      //Logout button
      button = new SystemButton(this, "gnome-logout", 3, _("Logout"), _("Leave the session"));        
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));
      button.setAction(Lang.bind(this, this._onLogoutAction));

      powerButtons.add_actor(button.actor, { y_align: St.Align.END, y_fill: false }); 
      this._systemButtons[1] = button;

      //Shutdown button
      button = new SystemButton(this, "gnome-shutdown", 3, _("Quit"), _("Shutdown the computer"));        
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent)); 
      button.setAction(Lang.bind(this, this._onShutdownAction));
        
      powerButtons.add_actor(button.actor, { y_align: St.Align.END, y_fill: false });
      this._systemButtons[2] = button;
      return powerButtons;
   },

   _sysButtonEnterEvent: function(actor, event) {
      this.old_active_item_actor = this._activeActor;
      /*let item_actor = this.applicationsBox.get_child_at_index(this.applicationsBox.get_children().length -1);
      this._scrollToButton(item_actor._delegate);*/
      this.applicationsScrollBox.vscroll.get_adjustment().set_value(this.applicationsScrollBox.vscroll.get_adjustment().upper);

      this.applicationsScrollBox.set_auto_scrolling(false);
      this.categoriesScrollBox.set_auto_scrolling(false);
      this.favoritesScrollBox.set_auto_scrolling(false);
    
      let index = this._indexOfSysButton(actor);
      this.selectedAppTitle.set_text(this._systemButtons[index].title);
      this.selectedAppDescription.set_text(this._systemButtons[index].description);
   },

   _sysButtonLeaveEvent: function(actor, event) {
      this._scrollToButton(this.old_active_item_actor._delegate);
      this.applicationsScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.selectedAppTitle.set_text("");
      this.selectedAppDescription.set_text("");
   },

   _indexOfSysButton: function(actor) {
      for(sysB in this._systemButtons)
         if(this._systemButtons[sysB].actor == actor)
            return sysB;
      return -1;
   },

   _onLockScreenAction: function() {
      this.menu.close();
            
      let screensaver_settings = new Gio.Settings({ schema: "org.cinnamon.screensaver" });                        
      let screensaver_dialog = Gio.file_new_for_path("/usr/bin/cinnamon-screensaver-command");    
      if(screensaver_dialog.query_exists(null)) {
         if(screensaver_settings.get_boolean("ask-for-away-message")) {                                    
            Util.spawnCommandLine("cinnamon-screensaver-lock-dialog");
         }
         else {
            Util.spawnCommandLine("cinnamon-screensaver-command --lock");
         }
      }
      else {                
         this._screenSaverProxy.LockRemote();
      }     
   },

   _onLogoutAction: function() {
      this.menu.close();
      this._session.LogoutRemote(0);
   },

   _onShutdownAction: function() {
      this.menu.close();
      this._session.ShutdownRemote();
   },

   loadClassic: function() {
      let rightPane = new St.BoxLayout({ vertical: true });        
//search
      this.searchBox = new St.BoxLayout({ vertical: false });//{ style_class: 'menu-search-box' });
      this.timerBox = new St.BoxLayout({ vertical: true });
      rightPane.add_actor(this.searchBox);

      this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                        hint_text: _("Type to search..."),
                                        track_hover: true,
                                        can_focus: true });
      this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

      this.searchBox.add(this.timerBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.timerBox.add(this.timeDate.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.timerBox.add(this.searchEntry, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.searchActive = false;
      this.searchEntryText = this.searchEntry.clutter_text;
      this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
      this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this._previousSearchPattern = "";
//search

      this.hover = new HoverIcon();
      this.searchBox.add(this.hover.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });

      this.categoriesApplicationsBox = new CinnamonMenu.CategoriesApplicationsBox();
      rightPane.add_actor(this.categoriesApplicationsBox.actor);

      this.favoritesScrollBox = this._createVerticalScroll();
      this.categoriesScrollBox = this._createVerticalScroll();
      this.applicationsScrollBox = this._createVerticalScroll();
      this._update_autoscroll();

      this.categoriesBox = new St.BoxLayout({ style_class: 'menu-categories-box', vertical: true });
      this.applicationsBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:true });
      this.favBoxWrapper = new St.BoxLayout({ vertical: true });
      this.favoritesBox = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: true });
      this.powerButtons = this._powerButtons(true);

      this.a11y_settings = new Gio.Settings({ schema: "org.cinnamon.desktop.a11y.applications" });
      this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
      this._updateVFade();

      this.favoritesScrollBox.add_actor(this.favoritesBox);
      this.favBoxWrapper.add(this.favoritesScrollBox, { y_align: St.Align.END, y_fill: true, expand: true });
      this.favBoxWrapper.add(this.powerButtons);

      this.categoriesScrollBox.add_actor(this.categoriesBox);
      this.applicationsScrollBox.add_actor(this.applicationsBox);

      this.betterPanel = new St.BoxLayout({ vertical: false });

      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesScrollBox, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, expand: false });

      this.categoriesApplicationsBox.actor.add_actor(this.betterPanel);
                                                          
      this.mainBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:false });

      this.mainBox.add_actor(rightPane, { span: 1 });

      this._refreshApps();

      this.endBox = new St.BoxLayout({ vertical: false });
      this.selectedAppBox = new St.BoxLayout({ style_class: 'menu-selected-app-box', vertical: true });
      this.selectedAppTitle = new St.Label({ style_class: 'menu-selected-app-title', text: "" });
      this.selectedAppBox.add(this.selectedAppTitle);
      this.selectedAppDescription = new St.Label({ style_class: 'menu-selected-app-description', text: "" });
      this.selectedAppBox.add_actor(this.selectedAppDescription);

      this.appBoxIter = new CinnamonMenu.VisibleChildIterator(this, this.applicationsBox);
      this.applicationsBox._vis_iter = this.appBoxIter;
      this.catBoxIter = new CinnamonMenu.VisibleChildIterator(this, this.categoriesBox);
      this.categoriesBox._vis_iter = this.catBoxIter;

      this.endBox.add(this.selectedAppBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.endBox.set_style("padding-right: 20px;");
   },

   loadStylized: function() {
      let rightPane = new St.BoxLayout({ vertical: true });        
//search
      this.searchBox = new St.BoxLayout({ vertical: false });//{ style_class: 'menu-search-box' });
      this.timerBox = new St.BoxLayout({ vertical: true });
      rightPane.add_actor(this.searchBox);
      this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                        hint_text: _("Type to search..."),
                                        track_hover: true,
                                        can_focus: true });
      //this.searchEntry.set_width(260);
      this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

      this.searchBox.add(this.timerBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.timerBox.add(this.timeDate.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.timerBox.add(this.searchEntry, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.searchActive = false;
      this.searchEntryText = this.searchEntry.clutter_text;
      this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
      this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this._previousSearchPattern = "";
//search

      this.hover = new HoverIcon();
      this.searchBox.add(this.hover.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });

      this.categoriesApplicationsBox = new CinnamonMenu.CategoriesApplicationsBox();
      rightPane.add_actor(this.categoriesApplicationsBox.actor);

      this.favoritesScrollBox = this._createVerticalScroll();
      this.categoriesScrollBox = this._createVerticalScroll();
      this.applicationsScrollBox = this._createVerticalScroll();
      this._update_autoscroll();

      this.categoriesBox = new St.BoxLayout({ style_class: 'menu-categories-box', vertical: true });
      this.applicationsBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:true });
      this.favBoxWrapper = new St.BoxLayout({ vertical: true });
      this.favoritesBox = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: true });

      this.a11y_settings = new Gio.Settings({ schema: "org.cinnamon.desktop.a11y.applications" });
      this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
      this._updateVFade();

      this.favoritesScrollBox.add_actor(this.favoritesBox);
      this.favBoxWrapper.add(this.favoritesScrollBox, { y_align: St.Align.END, y_fill: true, expand: true });

      this.categoriesScrollBox.add_actor(this.categoriesBox);
      this.applicationsScrollBox.add_actor(this.applicationsBox);

      this.betterPanel = new St.BoxLayout({ vertical: false });

      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesScrollBox, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, expand: false });

      this.categoriesApplicationsBox.actor.add_actor(this.betterPanel);
                                                          
      this.mainBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:false });

      this.mainBox.add_actor(rightPane, { span: 1 });

      this._refreshApps();

      this.endBox = new St.BoxLayout({ vertical: false });
      this.selectedAppBox = new St.BoxLayout({ style_class: 'menu-selected-app-box', vertical: true });
      this.selectedAppTitle = new St.Label({ style_class: 'menu-selected-app-title', text: "" });
      this.selectedAppBox.add_actor(this.selectedAppTitle);
      this.selectedAppDescription = new St.Label({ style_class: 'menu-selected-app-description', text: "" });
      this.selectedAppBox.add_actor(this.selectedAppDescription);

      this.appBoxIter = new CinnamonMenu.VisibleChildIterator(this, this.applicationsBox);
      this.applicationsBox._vis_iter = this.appBoxIter;
      this.catBoxIter = new CinnamonMenu.VisibleChildIterator(this, this.categoriesBox);
      this.categoriesBox._vis_iter = this.catBoxIter;

      this.powerButtons = this._powerButtons(false);

      this.endBox.add(this.selectedAppBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.endBox.set_style("padding-right: 20px;");
   },

   _onOpenStateChanged: function(menu, open) {
      if(open) {
         this.timeDate.startTimer();
         this.menuIsOpening = true;
         this.actor.add_style_pseudo_class('active');
         global.stage.set_key_focus(this.searchEntry);
         this._selectedItemIndex = null;
         this._activeContainer = null;
         this._activeActor = null;
        //  let monitorHeight = Main.layoutManager.primaryMonitor.height;
         if(!this.controlingHeight) {
            let applicationsBoxHeight = this.applicationsBox.get_allocation_box().y2-this.applicationsBox.get_allocation_box().y1;
            let scrollBoxHeight = (this.favoritesBox.get_allocation_box().y2-this.favoritesBox.get_allocation_box().y1) -
                                  (this.searchBox.get_allocation_box().y2-this.searchBox.get_allocation_box().y1);
            this.applicationsScrollBox.style = "height: "+scrollBoxHeight+"px;";
         }
         this.initButtonLoad = 30;
         let n = Math.min(this._applicationsButtons.length, this.initButtonLoad)
         for(let i = 0; i < n; i++) {
            if(!this._applicationsButtons[i].actor.visible) {
                this._applicationsButtons[i].actor.show();
            }
         }
         this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
         Mainloop.idle_add(Lang.bind(this, this._initial_cat_selection));
      } else {
         this._systemButtons[this.sysButtSelected].setActive(false);
         this.sysButtSelected = 0;
         this.timeDate.closeTimer();
         this.actor.remove_style_pseudo_class('active');
         if(this.searchActive) {
            this.resetSearch();
         }
         this.selectedAppTitle.set_text("");
         this.selectedAppDescription.set_text("");
         this._previousTreeItemIndex = null;
         this._previousTreeSelectedActor = null;
         this._previousSelectedActor = null;
         this.closeApplicationsContextMenus(null, false);

         this._clearAllSelections(false);
         this.destroyVectorBox();
      }
   }
};

function main(metadata, orientation, panel_height, instance_id) {  
    let myApplet = new MyApplet(orientation, panel_height, instance_id);
    return myApplet;      
}
