// Applet : Configurable Menu      Version      : v0.7-Beta
// O.S.   : Cinnamon               Release Date : 15 Dicember 2013.
// Author : Lester Carballo Pérez  Email        : lestcape@gmail.com
//
// Website : https://github.com/lestcape/Configurable-Menu
//
// This is a frock of Main Cinnamon menu applet with more configurable options.
//
// Skills including:
//
// 1. Can be active OnButtonPress action instead of OnButtonRelease.
// 2. You can control the menu with scrolling the height.
// 3. Support for theme change.
// 4. Enable and disable favorites.
// 5. Separate power button of favorites.
// 6. Different modes of view menu items.
// 7. Favorites with multiple lines.
// 8. And more for the future.
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

const Signals = imports.signals;





const ICON_SIZE = 16;




*/
const Util = imports.misc.util;
const Tweener = imports.ui.tweener;
const Pango = imports.gi.Pango;
const DND = imports.ui.dnd;
const GMenu = imports.gi.GMenu;
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
const AccountsService = imports.gi.AccountsService;
const FileUtils = imports.misc.fileUtils;
const AppletPath = imports.ui.appletManager.applets['configurableMenu@lestcape'];
const CinnamonMenu = AppletPath.cinnamonMenu;

let appsys = Cinnamon.AppSystem.get_default();

const USER_DESKTOP_PATH = FileUtils.getUserDesktopDir();

//const MAX_FAV_ICON_SIZE = 32;
//const HOVER_ICON_SIZE = 68;
//const APPLICATION_ICON_SIZE = 22;
const MAX_RECENT_FILES = 20;
//const CATEGORY_ICON_SIZE = 22;
/*
const LIB_PATH = '/usr/share/cinnamon/applets/menu@cinnamon.org';
imports.searchPath.unshift(LIB_PATH);
const CinnamonMenu = imports.applet;
*/

function TimeAndDate(){
   this._init();
}

TimeAndDate.prototype = {
   _init: function(metadata) {
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

function ButtonChangerBox(label, icon, parent) {
    this._init(label, icon, parent);
}

ButtonChangerBox.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function (label, icon, parent) {
        PopupMenu.PopupSubMenuMenuItem.prototype._init.call(this, label);

        this.actor.set_style_class_name('');
        this.box = new St.BoxLayout({ style_class: 'menu-category-button' });
        this.parent = parent;
        this.removeActor(this.label);
        this.removeActor(this._triangle);
        this._triangle = new St.Label();
        this.label = new St.Label({
            text: " " + label
        });
        this.icon = new St.Icon({
            style_class: 'popup-menu-icon',
            icon_type: St.IconType.FULLCOLOR,
            icon_name: icon,
            icon_size: 20
        });
        this.icon.realize();
        this.label.realize();
	this.box.add(this.label, {x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
	this.box.add(this.icon, {x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
        this.addActor(this.box);
    },

    setActive: function (active) {
        if(active) {
           global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
           this.box.set_style_class_name('menu-category-button-selected');
        }
        else {
           global.unset_cursor();
           this.box.set_style_class_name('menu-category-button');
        }
    },

    _onButtonReleaseEvent: function (actor, event) {
        if (event.get_button() == 1) {
            this.activate(event);
        }
    },

    activate: function (event) {
       if(this.label.get_text().indexOf(_("All Applications")) != -1) {
          //this.box.set_width(this.box.get_allocation_box().x2 - this.box.get_allocation_box().x1);
          this.label.set_text(_("Favorites"));
          this.parent.categoriesWrapper.visible = true;
          this.parent.applicationsScrollBox.visible = true;
          this.parent.favBoxWrapper.visible = false;
         /* if(this.parent.mainBox.get_children().indexOf(this.parent.rightPane) == -1)
             this.parent.mainBox.add(this.parent.rightPane, { span: 2, x_fill: false, expand: false });
          this.parent.mainBox.remove_actor(this.parent.favBoxWrapper);*/
       }
       else {
          this.label.set_text(_("All Applications"));
          this.parent.favBoxWrapper.visible = true;
          this.parent.categoriesWrapper.visible = false;
          this.parent.applicationsScrollBox.visible = false;
          /*if(this.parent.mainBox.get_children().indexOf(this.parent.favBoxWrapper) == -1)
             this.parent.mainBox.add(this.parent.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
          this.parent.mainBox.remove_actor(this.parent.rightPane);*/
       }
       /* if (this.parent.leftPane.get_child() == this.parent.favsBox) this.parent.switchPanes("apps");
        else this.parent.switchPanes("favs");*/
    }
};

function StaticBox(parent, appTitle, appDescription, hoverIcon, vertical, iconSize) {
   this._init(parent, appTitle, appDescription, hoverIcon, vertical, iconSize);
}

StaticBox.prototype = {
   _init: function(parent, appTitle, appDescription, hoverIcon, vertical, iconSize) {
      this.actor = new St.BoxLayout({ vertical: true });
      this.parent = parent;
      this.takingHover = false;
      this._staticButtons = new Array();
      this.appTitle = appTitle;
      this.appDescription = appDescription;
      this.hover = hoverIcon;
      this.vertical = vertical;
      this.iconSize = iconSize;
      this.initItems();
      //this.actor._delegate = this;
   },

   takeHover: function(take) {
      if((take)&&(!this.hoverBox)) {
         this.hoverBox = new St.BoxLayout({ vertical: false });
         this.hoverBox.add(this.hover.actor, { x_fill: false, x_align: St.Align.MIDDLE, expand: true });
         this.hoverBox.add_actor(this.hover.menu.actor);
         this.actor.insert_actor(this.hoverBox, 0);
      }
      else if((!take)&&(this.hoverBox)) {
         this.hoverBox.remove_actor(this.hover.actor);
         this.hoverBox.remove_actor(this.hover.menu.actor);
         this.actor.remove_actor(this.hoverBox);
         this.hoverBox = null;
      }
   },

   getFirstElement: function() {
      let childrens = this.actor.get_children();
      if(childrens.length > 0) {
         return childrens[0];
      }
      return null;
   },

   initItems: function() {
      let appSys = Cinnamon.AppSystem.get_default();
      let item;

      item = this._createSpecialButton("computer", _("Computer"), "computer:///");
      item.setAction(Lang.bind(this, this._onComputerAction));
      item = this._createSpecialButton("folder-home", _("Home"), GLib.get_home_dir());
      item.setAction(Lang.bind(this, this._onHomeAction));
      item = this._createSpecialButton("desktop", _("Desktop"), USER_DESKTOP_PATH);
      item.setAction(Lang.bind(this, this._onDesktopAction));
      //this._createPlace();
      item = this._createSpecialButton("user-trash", _("Trash"), "trash:///");
      item.setAction(Lang.bind(this, this._onTrashAction));

      this._createApp(appSys, "synaptic");
      this._createApp(appSys, "update-manager");
      this._createApp(appSys, "cinnamon-settings");
      this._createApp(appSys, "gnome-terminal");

      item = this._createSpecialButton("gnome-lockscreen", _("Lock screen"), _("Lock the screen"));
      item.setAction(Lang.bind(this, this._onLockScreenAction));
      item = this._createSpecialButton("gnome-logout", _("Logout"), _("Leave the session"));
      item.setAction(Lang.bind(this, this._onLogoutAction));
      item = this._createSpecialButton("gnome-shutdown", _("Quit"), _("Shutdown the computer"));
      item.setAction(Lang.bind(this, this._onShutdownAction));

//Places: Computer, HomeFolder, Network, Desktop Trash, 
//system:  Synaptic, control center, terminal, (power buttons)

//Home, Picture, Music, Videos, Documents
//Computer, Control Center
// Package Manager, Terminal, Help

   },

   _createApp: function(appSys, appName) {
      let iconSizeDrag = 32;
      let app = appSys.lookup_app(appName + ".desktop");
      if(app) {
         let item = new ApplicationButtonExtended(this.parent, app, this.vertical, this.iconSize, iconSizeDrag);
         item.actor.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
         item.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
         item.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, item));
         this.actor.add_actor(item.actor);
         this._staticButtons.push(item);
      }
   },

   _createPlace: function() {
      let iconSizeDrag = 32;
      let item;
      let bookmarks = Main.placesManager.getBookmarks();
      for(let id = 0; id < bookmarks.length; id++) {
          //Main.notify("PN:"+placeName.toLowerCase()+":BN:"+bookmarks[id].name.toLowerCase()+":"+bookmarks[id].name.toLowerCase().indexOf(placeName.toLowerCase()));
          //if(bookmarks[id].name.toLowerCase().indexOf(placeName.toLowerCase()) != -1)
          //if(bookmarks[id].name.toLowerCase() == placeName)
             //return bookmarks[id];
         item = new PlaceButtonExtended(this, bookmarks[id], bookmarks[id].name, this.vertical, this.iconSize);
         this.actor.add_actor(item.actor);
         this._staticButtons.push(item);
      }
   },

   _createSpecialButton: function(icon, title, description) {
      let item = new SystemButton(false, icon, title, description, this.hover, this.iconSize, true);
      item.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(6)+"px;padding-right: "+(2)+"px;margin:auto;";
      item.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      item.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));

      this.actor.add_actor(item.actor);
      this._staticButtons.push(item);
      return item;
   },

   navegateStaticBox: function(symbol, actor) {
      
   },

   _appEnterEvent: function(actor, event, applicationButton) {
      try {
      this.appTitle.set_text(applicationButton.app.get_name());
      if(applicationButton.app.get_description())
         this.appDescription.set_text(applicationButton.app.get_description());
      else
         this.appDescription.set_text("");
      //this._clearPrevAppSelection(applicationButton.actor);
      applicationButton.actor.style_class = "menu-application-button-selected";
      this.hover.refreshApp(applicationButton.app);
      } catch(e) {
         Main.notify("err:", e.message);
      }
   },

   _appLeaveEvent: function(actor, event, applicationButton) {
      applicationButton.actor.style_class = "menu-application-button";
      this.appTitle.set_text("");
      this.appDescription.set_text("");
      this.hover.refreshFace();;
   },

   _sysButtonEnterEvent: function(actor, event) {
      let index = this.actor.get_children().indexOf(actor);
      if(this.hoverBox)
         index --;
      this.appTitle.set_text(this._staticButtons[index].title);
      this.appDescription.set_text(this._staticButtons[index].description);
      this.hover.refresh(this._staticButtons[index].icon);
   },

   _sysButtonLeaveEvent: function(actor, event) {
      this.appTitle.set_text("");
      this.appDescription.set_text("");
      this.hover.refreshFace();
   },

   _onComputerAction: function() {
      this.parent.menu.close();
      Util.spawnCommandLine('xdg-open computer:///');
   },

   _onHomeAction: function() {
      this.parent.menu.close();
      Util.spawnCommandLine('xdg-open ' + GLib.get_home_dir());
   },

   _onDesktopAction: function() {
      this.parent.menu.close();
      Util.spawnCommandLine('xdg-open ' + USER_DESKTOP_PATH);
   },

   _onTrashAction: function() {
      this.parent.menu.close();
      Util.spawnCommandLine('xdg-open trash:///');
   },

   _onLockScreenAction: function() {
      this.parent._onLockScreenAction();
   },

   _onLogoutAction: function() {
      this.parent._onLogoutAction();
   },

   _onShutdownAction: function() {
      this.parent._onShutdownAction();
   }
};

function ApplicationContextMenuItemExtended(appButton, label, action) {
   this._init(appButton, label, action);
}

ApplicationContextMenuItemExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function (appButton, label, action) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {focusOnHover: false});

      this._appButton = appButton;
      this._action = action;
      this.label = new St.Label({ text: label });
      this.addActor(this.label);
   },

   activate: function (event) {
      switch (this._action) {
         case "add_to_panel":
            try {
               let winListApplet = imports.ui.appletManager.applets['WindowListGroup@jake.phy@gmail.com'];
               if(winListApplet)
                  winListApplet.applet.GetAppFavorites().addFavorite(this._appButton.app.get_id());
            } catch (e) {}
            
            let settings = new Gio.Settings({ schema: 'org.cinnamon' });
            let desktopFiles = settings.get_strv('panel-launchers');
            desktopFiles.push(this._appButton.app.get_id());
            settings.set_strv('panel-launchers', desktopFiles);
            /* if(!Main.AppletManager.get_object_for_uuid("panel-launchers@cinnamon.org")) {
               var new_applet_id = global.settings.get_int("next-applet-id");
               global.settings.set_int("next-applet-id", (new_applet_id + 1));
               var enabled_applets = global.settings.get_strv("enabled-applets");
               enabled_applets.push("panel1:right:0:panel-launchers@cinnamon.org:" + new_applet_id);
               global.settings.set_strv("enabled-applets", enabled_applets);
            }*/
            break;
         case "add_to_desktop":
            let file = Gio.file_new_for_path(this._appButton.app.get_app_info().get_filename());
            let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this._appButton.app.get_id());
            try {
               file.copy(destFile, 0, null, function(){});
               // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
               Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this._appButton.app.get_id()+"\"");
            } catch(e) {
               global.log(e);
            }
            break;
         case "add_to_favorites":
            AppFavorites.getAppFavorites().addFavorite(this._appButton.app.get_id());
            break;
         case "remove_from_favorites":
            AppFavorites.getAppFavorites().removeFavorite(this._appButton.app.get_id());
            break;
      }
      this._appButton.toggleMenu();
      return false;
   }
};

function GenericApplicationButtonExtended(appsMenuButton, app) {
   this._init(appsMenuButton, app);
}

GenericApplicationButtonExtended.prototype = {
   __proto__: CinnamonMenu.GenericApplicationButton.prototype,
    
   _init: function(appsMenuButton, app, withMenu) {
      this.app = app;
      this.appsMenuButton = appsMenuButton;
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});

      this.withMenu = withMenu;
      if(this.withMenu) {
         this.menu = new PopupMenu.PopupSubMenu(this.actor);
         this.menu.actor.set_style_class_name('menu-context-menu');
         this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));
      }
   },
    
   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button()==1) {
         this.activate(event);
      }
      if(event.get_button()==3) {
         if(this.withMenu && !this.menu.isOpen)
            this.appsMenuButton.closeApplicationsContextMenus(this.app, true);
         this.toggleMenu();
      }
      return true;
   },
    
   activate: function(event) {
      this.app.open_new_window(-1);
      this.appsMenuButton.menu.close();
   },
    
   closeMenu: function() {
      if(this.withMenu) this.menu.close();
   },
    
   toggleMenu: function() {
      if(!this.withMenu) return;
      if(!this.menu.isOpen) {
         let children = this.menu.box.get_children();
         for(var i in children) {
            this.menu.box.remove_actor(children[i]);
         }
         let menuItem;
         menuItem = new ApplicationContextMenuItemExtended(this, _("Add to panel"), "add_to_panel");
         this.menu.addMenuItem(menuItem);
         if(USER_DESKTOP_PATH) {
            menuItem = new ApplicationContextMenuItemExtended(this, _("Add to desktop"), "add_to_desktop");
            this.menu.addMenuItem(menuItem);
         }
         if(AppFavorites.getAppFavorites().isFavorite(this.app.get_id())) {
            menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from favorites"), "remove_from_favorites");
            this.menu.addMenuItem(menuItem);
         }else {
            menuItem = new ApplicationContextMenuItemExtended(this, _("Add to favorites"), "add_to_favorites");
            this.menu.addMenuItem(menuItem);
         }
      }
      this.menu.toggle();
   },
    
   _subMenuOpenStateChanged: function() {
      if(this.menu.isOpen) this.appsMenuButton._scrollToButton(this.menu);
   }
};

function CategoriesApplicationsBoxExtended() {
   this._init();
}

CategoriesApplicationsBoxExtended.prototype = {
   _init: function() {
      this.actor = new St.BoxLayout();
      this.actor._delegate = this;
   },
    
   acceptDrop : function(source, actor, x, y, time) {
      if(source instanceof FavoritesButtonExtended) {
         source.actor.destroy();
         actor.destroy();
         AppFavorites.getAppFavorites().removeFavorite(source.app.get_id());
         return true;
      }
      return false;
   }
};


function SystemBox() {
   this._init();
}

SystemBox.prototype = {
   _init: function() {
      this.actor = new St.BoxLayout();
      this.actor._delegate = this;
   },
    
   acceptDrop : function(source, actor, x, y, time) {
      if(source instanceof FavoritesButtonExtended) {
         source.actor.destroy();
         actor.destroy();
         AppFavorites.getAppFavorites().removeFavorite(source.app.get_id());
         return true;
      }
      return false;
   }
};

function VisibleChildIteratorExtended(parent, container, numberView) {
   this._init(parent, container, numberView);
}

VisibleChildIteratorExtended.prototype = {
   __proto__: CinnamonMenu.VisibleChildIterator.prototype,
   _init: function(parent, container, numberView) {
      this.container = container;
      this._parent = parent;
      this._numberView = numberView;
      this._num_children = 0;
      this.reloadVisible();
   },

   reloadVisible: function() {
      try {
      if(this._numberView == 1) {
         this.visible_children = new Array();
         this.abs_index = new Array();
         let child;
         let children = this.container.get_children();
         for (let i = 0; i < children.length; i++) {
            child = children[i];
            if (child.visible) {
                this.visible_children.push(child);
                this.abs_index.push(i);
            }
         }
      }
      else {
         this.visible_children = new Array();
         this.abs_index = new Array();
         this.inter_index = new Array();
         let child, internalBox, intIndex;
         let children = this.container.get_children();
         for(let j = 0; j < children.length; j++) {
            internalBox = children[j].get_children();
            intIndex = 0;
            for(let i = 0; i < internalBox.length; i++) {
               child = internalBox[i];
               if(child.visible) {
                  this.visible_children.push(child);
                  this.abs_index.push(j);
                  this.inter_index.push(intIndex);
                  intIndex++;
               }
            }
         }
      }
      this._num_children = this.visible_children.length;
      } catch(e) {
         Main.notify(e.message);
      }
   },

   setNumberView: function(numberView) {
      this._numberView = numberView;
   },

   getNextVisible: function(cur_child) {
      if(this.visible_children.indexOf(cur_child) == this._num_children-1)
         return this.visible_children[0];
      else
         return this.visible_children[this.visible_children.indexOf(cur_child)+1];
   },

   getPrevVisible: function(cur_child) {
      if(this.visible_children.indexOf(cur_child) == 0)
         return this.visible_children[this._num_children-1];
      else
         return this.visible_children[this.visible_children.indexOf(cur_child)-1];
   },

   getLeftVisible: function(cur_child) {
      let rowIndex = cur_child.get_parent().get_children().indexOf(cur_child);
      let colIndex = cur_child.get_parent().get_parent().get_children().indexOf(cur_child.get_parent());
      if(colIndex == 0)
         return cur_child.get_parent().get_parent().get_child_at_index(this._numberView - 1).get_child_at_index(rowIndex);
      else
         return cur_child.get_parent().get_parent().get_child_at_index(colIndex - 1).get_child_at_index(rowIndex);
   },

   getRightVisible: function(cur_child) {
      let rowIndex = cur_child.get_parent().get_children().indexOf(cur_child);
      let colIndex = cur_child.get_parent().get_parent().get_children().indexOf(cur_child.get_parent());
      let right_item;
      if(colIndex == this._numberView - 1)
         right_item = cur_child.get_parent().get_parent().get_child_at_index(0).get_child_at_index(rowIndex);
      else {
         right_item = cur_child.get_parent().get_parent().get_child_at_index(colIndex + 1).get_child_at_index(rowIndex);
         if(!right_item)
            right_item = right_item = cur_child.get_parent().get_parent().get_child_at_index(0).get_child_at_index(rowIndex);
      }
      return right_item;
   },

   getFirstVisible: function() {
      return this.visible_children[0];
   },

   getLastVisible: function() {
      return this.visible_children[this._num_children-1];
   },

   getVisibleIndex: function(cur_child) {
      return this.visible_children.indexOf(cur_child);
   },

   getVisibleItem: function(index) {
      return this.visible_children[index];
   },

   getNumVisibleChildren: function() {
      return this._num_children;
   },

   getInternalIndexOfChild: function(child) {
      //return child.get_parent().get_parent().get_children().indexOf(child.get_parent());
      if(this.inter_index)
         return this.inter_index[this.visible_children.indexOf(child)];
      return 0;
   },

   getAbsoluteIndexOfChild: function(child) {
      return this.abs_index[this.visible_children.indexOf(child)];
   }
};

function HoverIcon(parent, iconSize) {
   this._init(parent, iconSize);
}

HoverIcon.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      try {
         //this.actor._delegate = this;
         this.iconSize = iconSize;
         this.actor.style = "padding-top: "+(0)+"px;padding-bottom: "+(0)+"px;padding-left: "+(0)+"px;padding-right: "+(0)+"px;margin:auto;";
         this._userIcon = new St.Icon({ icon_size: this.iconSize });
         this.icon = new St.Icon({ icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
         this.parent = parent;
         
         this.menu = new PopupMenu.PopupSubMenu(this.actor);
         this.menu.actor.set_style_class_name('menu-context-menu');
         this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));

         this._user = AccountsService.UserManager.get_default().get_user(GLib.get_user_name());
         this._userLoadedId = this._user.connect('notify::is_loaded', Lang.bind(this, this._onUserChanged));
         this._userChangedId = this._user.connect('changed', Lang.bind(this, this._onUserChanged));

         let menuItem;
         let userBox = new St.BoxLayout({ style_class: 'user-box', vertical: false });
         this.userLabel = new St.Label(({ /*style_class: 'user-label'*/}));
         userBox.add(this.userLabel, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
         this.menu.addActor(userBox);

        // this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

         this.notificationsSwitch = new PopupMenu.PopupSwitchMenuItem(_("Notifications"), this._toggleNotifications);
         this.notificationsSwitch.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(1)+"px;padding-right: "+(1)+"px;margin:auto;";
         this.menu.addMenuItem(this.notificationsSwitch);
         global.settings.connect('changed::display-notifications', Lang.bind(this, function() {
            this.notificationsSwitch.setToggleState(global.settings.get_boolean("display-notifications"));
         }));
         this.notificationsSwitch.connect('toggled', Lang.bind(this, function() {
            global.settings.set_boolean("display-notifications", this.notificationsSwitch.state);
         }));

         this.account = new PopupMenu.PopupMenuItem(_("Account Details"));
         this.account.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(1)+"px;padding-right: "+(1)+"px;margin:auto;";
         this.menu.addMenuItem(this.account);
         this.account.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine("cinnamon-settings user");
         }));

         this._onUserChanged();
         this.refreshFace();
      } catch(e) {
         Main.notifyError("Error:",e.message);
      }
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this._userIcon)
         this._userIcon.set_icon_size(this.iconSize);
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
      if(this.lastApp)
         this.lastApp.set_icon_size(this.iconSize);
   },

   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button()==1) {
         this.activate(event);
      }
      if(event.get_button()==3) {
         this.toggleMenu();
      }
      return true;
   },

   _subMenuOpenStateChanged: function() {
       //if (this.menu.isOpen) this.appsMenuButton._scrollToButton(this.menu);
       if(!this.menu.isOpen) {
          this.parent.searchEntry.set_width(-1);
          //this.menu.actor.can_focus = false;
       }
       /*else
          this.menu.actor.can_focus = true;*/
   },
    
   activate: function(event) {
      //this.parent.menu.close();
      //Main.notify("close");
      //PopupBaseMenuItem.prototype.activate.call(this, event, true);
   },

   closeMenu: function() {
      this.menu.close();
   },
    
   toggleMenu: function() {
      if(!this.menu.isOpen)
         if(this.actor.get_parent() == this.parent.searchBox)
            //this.actor.get_parent().set_width(this.actor.get_parent().get_allocation_box().x2 - this.actor.get_parent().get_allocation_box().x1);
            this.parent.searchEntry.set_width(200);
      this.menu.toggle();
   },

   _onUserChanged: function() {
      if(this._user.is_loaded) {
         this.userLabel.set_text (this._user.get_real_name());
         if(this._userIcon) {

            let iconFileName = this._user.get_icon_file();
            let iconFile = Gio.file_new_for_path(iconFileName);
            let icon;
            if(iconFile.query_exists(null)) {
               icon = new Gio.FileIcon({file: iconFile});
            } else {
               icon = new Gio.ThemedIcon({name: 'avatar-default'});
            }
            this._userIcon.set_gicon(icon);
            this._userIcon.show(); 
 
         }
      }
   },

   refresh: function (icon) {
      this._removeIcon();
      this.addActor(this.icon);
      this.icon.set_icon_name(icon);
   },

   refreshApp: function (app) {
      this._removeIcon();
      this.lastApp = app.create_icon_texture(this.iconSize);
      this.addActor(this.lastApp);
   },

   refreshPlace: function (place) {
      this._removeIcon();
      this.lastApp = place.iconFactory(this.iconSize);
      this.addActor(this.lastApp);
   },

   refreshFile: function (file) {
      this._removeIcon();
      this.lastApp = file.createIcon(this.iconSize);
      this.addActor(this.lastApp);
   },

   refreshFace: function () {
      this._removeIcon();
      this.addActor(this._userIcon);
   },

   _removeIcon: function () {
      if(this.lastApp) {
         this.removeActor(this.lastApp);
         this.lastApp.destroy();
         this.lastApp = null;
      }
      this.removeActor(this.icon);
      this.removeActor(this._userIcon);
   }
};

function FavoritesBoxExtended(vertical, numberLines) {
   this._init(vertical, numberLines);
}

FavoritesBoxExtended.prototype = {
   _init: function(vertical, numberLines) {
      this.actor = new St.BoxLayout();
      this.actor.set_vertical(!vertical);
      this.actor._delegate = this;
      this.numberLines = numberLines;
      let internalLine;
      for(let i = 0; i < this.numberLines; i++) {
         internalLine = new St.BoxLayout();
         internalLine.set_vertical(vertical);
         this.actor.add(internalLine, { x_align: St.Align.MIDDLE, y_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
      this.setVertical(vertical);
      this._dragPlaceholder = null;
      this._dragPlaceholderPos = -1;
      this._animatingPlaceholdersCount = 0;
   },

   getNumberLines: function() {
      return this.numberLines;
   },

   setNumberLines: function(numberLines) {
      let childrens = this.actor.get_children();
      let childrensItems;
      let saveItems = new Array();
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            saveItems.push(childrensItems[j]);
            childrens[i].remove_actor(childrensItems[j]);
            childrensItems[j].destroy();
         }
      }

      let internalLine;
      for(let i = this.numberLines; i < numberLines; i++) {
         internalLine = new St.BoxLayout();
         internalLine.set_vertical(this.isVertical);
         this.actor.add(internalLine, { x_align: St.Align.MIDDLE, y_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
      for(let i = numberLines; i < this.numberLines; i++) {
         this.actor.remove_actor(childrens[i]);
      }
      this.numberLines = numberLines;
      for(let i = 0; i < saveItems.length; i++) {
         this.add(saveItems[i]);
      }
   },

   setVertical: function(vertical) {
      this.isVertical = vertical;
      this.actor.set_vertical(!vertical);
      let childrens = this.actor.get_children();
      for(let i = 0; i < childrens.length; i++) {
         childrens[i].set_vertical(vertical);
      }
   },

   getFirstElement: function() {
      let childrens = this.actor.get_children();
      if(childrens.length > 0) {
         let childrensItems = childrens[0].get_children();
         if(childrensItems.length > 0)
            return childrensItems[0];
      }
      return null;
   },

   getVertical: function() {
      return this.isVertical;
   },

   getRealSpace: function() {
      let result = 0;
      let childrens = this.actor.get_children();
      for(let i = 0; i < childrens.length; i++)
         result += childrens[i].get_height();
      return result;
   },

   add: function(actor, properties) {
      let childrens = this.actor.get_children();
      let currentNumberLines = childrens[0].get_children().length;
      if(currentNumberLines == 0) {
         childrens[0].add(actor, properties);
      }
      else {
         for(let i = 1; i < childrens.length; i++) {
            if(currentNumberLines > childrens[i].get_children().length) {
               childrens[i].add(actor, properties);
               currentNumberLines--; 
               break;
            }
         }
         if(currentNumberLines == childrens[0].get_children().length)
            childrens[0].add(actor, properties);
      }
   },

   insert: function(actor, posX, posY) {
      if((posX > -1)&&(posY > -1)) {
         let posI, posE;
         if(this.isVertical) {
            posI = posX;
            posE = posY;
         }
         else {
            posI = posY;
            posE = posX;
         }
         let childrens = this.actor.get_children();
         if((posI < childrens.length)&&(posE <= childrens[posI].get_children().length)) {
            childrens[posI].insert_actor(actor, posE);
         }
      }
   },

   removeAll: function() {
      //Remove all favorites
      let childrens = this.actor.get_children();
      let childrensItems;
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            childrens[i].remove_actor(childrensItems[j]);
            childrensItems[j].destroy();
         }
      }
   },

   _generateChildrenList: function() {
      let result = new Array();
      let childrens = this.actor.get_children();
      let childrensItems;
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            result.push(childrensItems[j]);
         }
      }
      return result;
   },

   _clearDragPlaceholder: function() {
      if(this._dragPlaceholder) {
         this._dragPlaceholder.animateOutAndDestroy();
         this._dragPlaceholder = null;
         this._dragPlaceholderPosX = -1;
         this._dragPlaceholderPosY = -1;
      }
   },
    
   handleDragOver: function(source, actor, x, y, time) {
   try {
      let app = source.app;

      // Don't allow favoriting of transient apps
      if(app == null || app.is_window_backed() || (!(source instanceof FavoritesButtonExtended) && app.get_id() in AppFavorites.getAppFavorites().getFavoriteMap()))
         return DND.DragMotionResult.NO_DROP;

      let favorites = AppFavorites.getAppFavorites().getFavorites();
      let numFavorites = favorites.length;

      let favPos = favorites.indexOf(app);

      let childrenBox = this.actor.get_children();
      let numChildrenBox = childrenBox.length;
      let boxHeight = this.actor.height;
      let boxWidth = this.actor.width;

      // Keep the placeholder out of the index calculation; assuming that
      // the remove target has the same size as "normal" items, we don't
      // need to do the same adjustment there.
      /*if(this._dragPlaceholder) {
          if(this.isVertical)
             boxHeight -= this._dragPlaceholder.actor.height;
          else
             boxWidth -= this._dragPlaceholder.actor.width;
          numChildrenBox--;
      }*/

      let posY, posX, itemChild;
      let itemsInline = 0;
      if(this.isVertical) {
         posX = Math.round(x * this.numberLines / boxWidth) - 1;
         if(posX >= childrenBox.length)
            posX = childrenBox.length - 1;
         if(posX < 0)
            posX = 0;
         itemChild = childrenBox[posX].get_children();
         if(itemChild)
            itemsInline = itemChild.length;
         posY = Math.round(y * itemsInline / boxHeight);
         if(posY >= itemsInline - 1)
            posY = itemsInline - 2;
         if(posY < 0)
            posY = 0;
      }
      else {
         posY = Math.round(y * this.numberLines / boxHeight) - 1;
         if(posY >= childrenBox.length)
            posY = childrenBox.length - 1;
         if(posY < 0)
            posY = 0;
         itemChild = childrenBox[posY].get_children();
         if(itemChild)
            itemsInline = itemChild.length;
         posX = Math.round(x * itemsInline / boxWidth);
         if(posX >= itemsInline - 1)
            posX = itemsInline - 2;
         if(posX < 0)
            posX = 0;
      }

      if(((posY != this._dragPlaceholderPosY)||(posX != this._dragPlaceholderPosX))) {
         this._dragPlaceholderPosX = posX;
         this._dragPlaceholderPosY = posY;

            // If the placeholder already exists, we just move
            // it, but if we are adding it, expand its size in
            // an animation
            let fadeIn;
            if(this._dragPlaceholder) {
               this._dragPlaceholder.actor.destroy();
               fadeIn = false;
            } else {
               fadeIn = true;
            }

            this._dragPlaceholder = new DND.GenericDragPlaceholderItem();
            let dragSize = source.actor.height;
            if((this.actor.get_children().length > 0)&&(this.actor.get_children()[0].get_children().length > 0))
               dragSize = this.actor.get_children()[0].get_children()[0].height;
            this._dragPlaceholder.child.set_width(dragSize);
            this._dragPlaceholder.child.set_height(dragSize);
           // this.actor.insert_actor(this._dragPlaceholder.actor,
           //                        this._dragPlaceholderPos);
            this.insert(this._dragPlaceholder.actor, this._dragPlaceholderPosX, this._dragPlaceholderPosY);
            if(fadeIn)
               this._dragPlaceholder.animateIn();
        }

        let srcIsFavorite = (favPos != -1);

        if(srcIsFavorite)
           return DND.DragMotionResult.MOVE_DROP;

        return DND.DragMotionResult.COPY_DROP;
      } catch(e) {
        Main.notify("efx", e.message);
      }
   },
    
   // Draggable target interface
   acceptDrop: function(source, actor, x, y, time) {
     try {
        let app = source.app;
        // Don't allow favoriting of transient apps
        if(app == null || app.is_window_backed()) {
            return false;
        }

        let id = app.get_id();

        let favorites = AppFavorites.getAppFavorites().getFavoriteMap();

        let srcIsFavorite = (id in favorites);

        let posX, posY;
        if(this.isVertical) {
           posX = this._dragPlaceholderPosX;
           posY = this._dragPlaceholderPosY;
        }
        else {
           posX = this._dragPlaceholderPosY;
           posY = this._dragPlaceholderPosX;
        }

       // Main.notify("posX:" + posX + " posY:" + posY);

        let favPos = 0;
        let cPosY = 0;
        let maxPosY = 1;
        let childrens = this.actor.get_children();
        let childrensItems;
        while(cPosY < maxPosY + 1) {
           for(let i = 0; i < childrens.length; i++) {
              childrensItems = childrens[i].get_children();
              maxPosY = childrensItems.length;
              if(i == posX) {
                 maxPosY = posY;
                 if(cPosY == posY)
                   break;
              }
              if(this._dragPlaceholder &&
                 childrensItems[cPosY] == this._dragPlaceholder.actor)
                 continue;
            
              if(!(childrensItems[cPosY]._delegate instanceof FavoritesButtonExtended)) continue;

              let childId = childrensItems[cPosY]._delegate.app.get_id();
              if(childId == id)
                 continue;
              if(childId in favorites)
                 favPos++;
           }
           cPosY++;
        }

        Meta.later_add(Meta.LaterType.BEFORE_REDRAW, Lang.bind(this,
            function () {
                let appFavorites = AppFavorites.getAppFavorites();
                if (srcIsFavorite) {
                    appFavorites.moveFavoriteToPos(id, favPos);
                }
                else {
                    appFavorites.addFavoriteAtPos(id, favPos);
                }
                return false;
            }));

        return true;
      } catch(e) {
        Main.notify("ef", e.message);
      }
   },

   navegateFavBox: function(symbol, actor) {
      let childrens = this.actor.get_children();
      let childrensItems;
      let posX, posY;
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            if(childrensItems[j] == actor)  {
               posY = i;
               posX = j;
               break;
            }
         }
         if(posX)
            break;
      }
      if(this.isVertical) {
         if(symbol == Clutter.KEY_Up) {
            if(posX == 0)
               posX = childrens[posY].get_children().length - 1;
            else
               posX--;
         }
         else if(symbol == Clutter.KEY_Down) {
            if(posX == childrens[posY].get_children().length - 1)
               posX = 0;
            else
               posX++;
         }
         else if(symbol == Clutter.KEY_Right) {
            if(posY == childrens.length - 1)
               posY = 0;
            else
               posY++;
         }
         else if(symbol == Clutter.KEY_Left) {
            if(posY == 0)
               posY = childrens.length - 1;
            else
               posY--;
         }
      }
      else {
        if(symbol == Clutter.KEY_Up) {
            if(posY == 0)
               posY = childrens.length - 1;
            else
               posY--;
         }
         else if(symbol == Clutter.KEY_Down) {
            if(posY == childrens.length - 1)
               posY = 0;
            else
               posY++;
         }
         else if(symbol == Clutter.KEY_Right) {
            if(posX == childrens[posY].get_children().length - 1)
               posX = 0;
            else
               posX++;
         }
         else if(symbol == Clutter.KEY_Left) {
            if(posX == 0)
               posX = childrens[posY].get_children().length - 1;
            else
               posX--;
         }
      }
      global.stage.set_key_focus(childrens[posY].get_children()[posX]);
      return childrens[posY].get_children()[posX];
   }
};

function TransientButtonExtended(appsMenuButton, pathOrCommand, iconSize) {
   this._init(appsMenuButton, pathOrCommand, iconSize);
}

TransientButtonExtended.prototype = {
   __proto__: CinnamonMenu.TransientButton.prototype,
    
   _init: function(appsMenuButton, pathOrCommand, iconSize) {
      this.iconSize = iconSize;
      let displayPath = pathOrCommand;
      if(pathOrCommand.charAt(0) == '~') {
         pathOrCommand = pathOrCommand.slice(1);
         pathOrCommand = GLib.get_home_dir() + pathOrCommand;
      }

      this.isPath = pathOrCommand.substr(pathOrCommand.length - 1) == '/';
      if(this.isPath) {
         this.path = pathOrCommand;
      } else {
         let n = pathOrCommand.lastIndexOf('/');
         if(n != 1) {
            this.path = pathOrCommand.substr(0, n);
         }
      }

      this.pathOrCommand = pathOrCommand;

      this.appsMenuButton = appsMenuButton;
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});

      let iconBox = new St.Bin();
      this.file = Gio.file_new_for_path(this.pathOrCommand);
      try {
         this.handler = this.file.query_default_handler(null);
         let icon_uri = this.file.get_uri();
         let fileInfo = this.file.query_info(Gio.FILE_ATTRIBUTE_STANDARD_TYPE, Gio.FileQueryInfoFlags.NONE, null);
         let contentType = Gio.content_type_guess(this.pathOrCommand, null);
         let themedIcon = Gio.content_type_get_icon(contentType[0]);
         this.icon = new St.Icon({gicon: themedIcon, icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
         this.actor.set_style_class_name('menu-application-button');
      } catch (e) {
         this.handler = null;
         let iconName = this.isPath ? 'gnome-folder' : 'unknown';
         this.icon = new St.Icon({icon_name: iconName, icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
         // @todo Would be nice to indicate we don't have a handler for this file.
         this.actor.set_style_class_name('menu-application-button');
      }

      // We need this fake app to help appEnterEvent/appLeaveEvent 
      // work with our search result.
      this.app = {
         get_app_info: {
            get_filename: function() {
               return pathOrCommand;
            }
         },
         get_id: function() {
            return -1;
         },
         get_description: function() {
            return pathOrCommand;
         },
         get_name: function() {
            return  '';
         },
         create_icon_texture: function(appIconSize) {
            try {
               let contentType = Gio.content_type_guess(pathOrCommand, null);
               let themedIcon = Gio.content_type_get_icon(contentType[0]);
               return new St.Icon({gicon: themedIcon, icon_size: appIconSize, icon_type: St.IconType.FULLCOLOR });
            } catch (e) {
               let isPath = pathOrCommand.substr(pathOrCommand.length - 1) == '/';
               let iconName = isPath ? 'gnome-folder' : 'unknown';
               return new St.Icon({icon_name: iconName, icon_size: appIconSize, icon_type: St.IconType.FULLCOLOR });
            }
         }
      };

      this.label = new St.Label({ text: displayPath, style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.addActor(this.container);

      this.isDraggableApp = false;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }
   }
};

function SystemButton(appsMenuButton, icon, title, description, hoverIcon, iconSize, haveText) {
   this._init(appsMenuButton, icon, title, description, hoverIcon, iconSize, haveText);
}

SystemButton.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,

   _init: function(appsMenuButton, icon, title, description, hoverIcon, iconSize, haveText) {
      GenericApplicationButtonExtended.prototype._init.call(this, appsMenuButton);
      this.actor.set_style_class_name('menu-favorites-button');
      this.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(2)+"px;padding-right: "+(2)+"px;margin:auto;";
      this.haveText = haveText;
      this.iconSize = iconSize;
      this.icon = icon;
      this.title = title;
      this.description = description;
      this.actionCallBack = null;
      this.active = false;
      this.hoverIcon = hoverIcon;
      
      this.container = new St.BoxLayout();
      this.iconObj = new St.Icon({icon_name: icon, icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      this.container.add(this.iconObj, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });

      if(this.haveText) {
         this.label = new St.Label({ text: this.title , style_class: 'menu-application-button-label' });
         this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
         this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
         this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
         this.textBox = new St.BoxLayout({ vertical: false });
         this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      }

      this.addActor(this.container);
      this.iconObj.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         this.iconObj.set_icon_size(this.iconSize);
      }
   },

   setAction: function(actionCallBack) {
      this.actionCallBack = actionCallBack;
      this.actor.connect('button-press-event', Lang.bind(this, this.executeAction));
   },

   executeAction: function(actor, event) {
      if((this.actionCallBack)&&((!event)||(event.get_button()==1)))
         this.actionCallBack();
   },

   setActive: function(active) {
      this.active = active;
      if(this.active) {
         this.hoverIcon.refresh(this.icon);
         this.actor.set_style_class_name('menu-category-button-selected');
      }
      else {
         this.hoverIcon.refreshFace();
         this.actor.set_style_class_name('menu-favorites-button');
      }
   }
};

function ApplicationButtonExtended(appsMenuButton, app, vertical, iconSize, iconSizeDrag) {
   this._init(appsMenuButton, app, vertical, iconSize, iconSizeDrag);
}

ApplicationButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(appsMenuButton, app, vertical, iconSize, iconSizeDrag) {
      GenericApplicationButtonExtended.prototype._init.call(this, appsMenuButton, app, true);
      this.iconSize = iconSize;
      this.iconSizeDrag = iconSizeDrag;
      this.category = new Array();
      this.actor.set_style_class_name('menu-application-button');
      this.icon = this.app.create_icon_texture(this.iconSize);
      this.name = this.app.get_name();
      this.label = new St.Label({ text: this.name , style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: vertical });
      this.setVertical(vertical);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.addActor(this.container);
      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));
      this.isDraggableApp = true;
      this.icon.realize();
      this.label.realize();
   },

   _onDragEnd: function() {
      let [x, y, mask] = global.get_pointer();
      let reactiveActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);
      let allActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
      let typeName = "" + allActor;
      if((reactiveActor instanceof Clutter.Stage)&&(typeName.indexOf("MetaWindowGroup") != -1)) {
         let file = Gio.file_new_for_path(this.app.get_app_info().get_filename());
         let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this.app.get_id());
         try {
            file.copy(destFile, 0, null, function(){});
            // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
            Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this.app.get_id()+"\"");
            return true;
         } catch(e) {
            global.log(e);
         }
      }
      return false;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },
 
   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }
   },
 
   get_app_id: function() {
      return this.app.get_id();
   },
    
   getDragActor: function() {
      /*let favorites = AppFavorites.getAppFavorites().getFavorites();
      let nbFavorites = favorites.length;
      let monitorHeight = Main.layoutManager.primaryMonitor.height;
      let real_size = (0.7*monitorHeight) / nbFavorites;
      let icon_size = 0.6*real_size;
      if(icon_size > this.iconSizeDrag) icon_size = this.iconSizeDrag;*/
      let icon_size = this.iconSize;
      if(this.iconSizeDrag < this.iconSize)
         icon_size = this.iconSizeDrag;
      return this.app.create_icon_texture(icon_size);
    },

    // Returns the original actor that should align with the actor
    // we show as the item is being dragged.
    getDragActorSource: function() {
       return this.actor;
    }
};

function PlaceButtonExtended(appsMenuButton, place, button_name, vertical, iconSize) {
   this._init(appsMenuButton, place, button_name, vertical, iconSize);
}

PlaceButtonExtended.prototype = {
   __proto__: CinnamonMenu.PlaceButton.prototype,

   _init: function(appsMenuButton, place, button_name, vertical, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.appsMenuButton = appsMenuButton;
      this.place = place;
      this.button_name = button_name;
      this.actor.set_style_class_name('menu-application-button');
      this.actor._delegate = this;
      this.label = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: vertical });
      this.setVertical(vertical);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = place.iconFactory(this.iconSize);
      if(!this.icon)
         this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      if(this.icon)
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);          
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }
   }
};

function RecentButtonExtended(appsMenuButton, file, vertical, iconSize) {
   this._init(appsMenuButton, file, vertical, iconSize);
}

RecentButtonExtended.prototype = {
   __proto__: CinnamonMenu.RecentButton.prototype,

   _init: function(appsMenuButton, file, vertical, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.file = file;
      this.appsMenuButton = appsMenuButton;
      this.button_name = this.file.name;
      this.actor.set_style_class_name('menu-application-button');
      this.actor._delegate = this;
      this.label = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
      this.label.set_style("max-width: 250px;");
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: vertical });
      this.setVertical(vertical);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = file.createIcon(this.iconSize);
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }
   }
};

function RecentClearButtonExtended(appsMenuButton, vertical, iconSize) {
   this._init(appsMenuButton, vertical, iconSize);
}

RecentClearButtonExtended.prototype = {
   __proto__: CinnamonMenu.RecentClearButton.prototype,

   _init: function(appsMenuButton, vertical, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.appsMenuButton = appsMenuButton;
      this.actor.set_style_class_name('menu-application-button');
      this.button_name = _("Clear list");
      this.actor._delegate = this;
      this.label = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: vertical });
      this.setVertical(vertical);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = new St.Icon({ icon_name: 'edit-clear', icon_type: St.IconType.SYMBOLIC, icon_size: this.iconSize });
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }
   }
};

function FavoritesButtonExtended(appsMenuButton, vertical, app, nbFavorites, iconSize, allowName) {
   this._init(appsMenuButton, vertical, app, nbFavorites, iconSize, allowName);
}

FavoritesButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(appsMenuButton, vertical, app, nbFavorites, iconSize, allowName) {
      GenericApplicationButtonExtended.prototype._init.call(this, appsMenuButton, app);
      this.iconSize = iconSize;
      this.vertical = vertical;
      this.allowName = allowName;
      this.nbFavorites = nbFavorites;

      let icon_size = this.iconSize;
      if(!allowName) {
         let monitorHeight;
         if(this.vertical)
            monitorHeight = Main.layoutManager.primaryMonitor.height;
         else
            monitorHeight = Main.layoutManager.primaryMonitor.width;
         let real_size = (0.7*monitorHeight) / this.nbFavorites;
         icon_size = 0.7*real_size;
         if(icon_size > this.iconSize) icon_size = this.iconSize;
      }
      this.actor.style = "padding-top: "+2+"px;padding-bottom: "+2+"px;padding-left: "+(2)+"px;padding-right: "+(2)+"px;margin:auto;";
      this.actor.add_style_class_name('menu-favorites-button');

      this.container = new St.BoxLayout();
      this.icon = app.create_icon_texture(icon_size);
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });

      if(this.allowName) {
         this.label = new St.Label({ text: this.app.get_name(), style_class: 'menu-application-button-label' });
         this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
         this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
         this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);

         this.textBox = new St.BoxLayout({ vertical: false });
         this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      }

      this.addActor(this.container);

      this.icon.realize()

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));  
      this.isDraggableApp = true;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         if(this.vertical)
            monitorHeight = Main.layoutManager.primaryMonitor.height;
         else
            monitorHeight = Main.layoutManager.primaryMonitor.width;
         let real_size = (0.7*monitorHeight) / this.nbFavorites;
         let icon_size = 0.7*real_size;
         if(icon_size > this.iconSize) icon_size = this.iconSize;
         this.icon.set_icon_size(this.iconSize);
      }
   },

   _onDragEnd: function(actor, time, acepted) {
      //Main.notify("actor:" + actor + " time:" + time + " acepted:" + acepted);
      let [x, y, mask] = global.get_pointer();
      let reactiveActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);
      let allActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
      let typeName = "" + allActor;
      if((reactiveActor instanceof Clutter.Stage)&&(typeName.indexOf("MetaWindowGroup") != -1)) {
         let file = Gio.file_new_for_path(this.app.get_app_info().get_filename());
         let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this.app.get_id());
         try {
            file.copy(destFile, 0, null, function(){});
            // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
            Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this.app.get_id()+"\"");
            return true;
         } catch(e) {
            global.log(e);
         }
      }
      return false;
   }
};

function CategoryButtonExtended(app, iconSize) {
   this._init(app, iconSize);
}

CategoryButtonExtended.prototype = {
   __proto__: CinnamonMenu.CategoryButton.prototype,

   _init: function(category, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.actor.set_style_class_name('menu-category-button');
      var label;
      let icon = null;
      if(category) {
         icon = category.get_icon();
         if(icon && icon.get_names)
            this.icon_name = icon.get_names().toString();
         else
            this.icon_name = "";
         label = category.get_name();
      } else
         label = _("All Applications");
        
      this.actor._delegate = this;
      this.label = new St.Label({ text: label, style_class: 'menu-category-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      if(category && this.icon_name) {
         this.icon = St.TextureCache.get_default().load_gicon(null, icon, this.iconSize);
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.label.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
    /*  this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }*/
   }
};

function PlaceCategoryButtonExtended(app, iconSize) {
    this._init(app, iconSize);
}

PlaceCategoryButtonExtended.prototype = {
   __proto__: CinnamonMenu.PlaceCategoryButton.prototype,

   _init: function(category, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.actor.set_style_class_name('menu-category-button');
      this.actor._delegate = this;
      this.label = new St.Label({ text: _("Places"), style_class: 'menu-category-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
     /* this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }*/
   }
};

function RecentCategoryButtonExtended(app, iconSize) {
   this._init(app, iconSize);
}

RecentCategoryButtonExtended.prototype = {
   __proto__: CinnamonMenu.RecentCategoryButton.prototype,

   _init: function(category, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.actor.set_style_class_name('menu-category-button');
      this.actor._delegate = this;
      this.label = new St.Label({ text: _("Recent Files"), style_class: 'menu-category-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = new St.Icon({icon_name: "folder-recent", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
     /* this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }*/
   }
};

function MyApplet(orientation, panel_height, instance_id) {
   this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
   __proto__: CinnamonMenu.MyApplet.prototype,

   _init: function(orientation, panel_height, instance_id) {
      Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
      try {
         this.allowFavName = false;
         this.iconAppSize = 22;
         this.iconCatSize = 22;
         this.iconMaxFavSize = 20;
         this.iconPowerSize = 20;
         this.iconHoverSize = 68;
         this.iconView = false;
         this.iconViewCount = 4;
         this.favoritesLinesNumber = 1;
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
//this.on_orientation_changed(orientation);
         this.actor.connect('key-press-event', Lang.bind(this, this._onSourceKeyPress));
         this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPressEvent));
         //this._keyFocusNotifyIDSignal = global.stage.connect('notify::key-focus', Lang.bind(this, this._onKeyFocusChanged));

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
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-view-item", "showView", this._setVisibleViewControl, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "view-item", "iconView", this._refreshApps, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "view-icon-count", "iconViewCount", this._refreshApps, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-press", "activateOnPress", null, null);
this.settings.bindProperty(Settings.BindingDirection.IN, "icon-app-size", "iconAppSize", this._refreshApps, null);
this.settings.bindProperty(Settings.BindingDirection.IN, "icon-cat-size", "iconCatSize", this._refreshApps, null);
this.settings.bindProperty(Settings.BindingDirection.IN, "icon-max-fav-size", "iconMaxFavSize", this._setIconMaxFavSize, null);
this.settings.bindProperty(Settings.BindingDirection.IN, "icon-power-size", "iconPowerSize", this._setIconPowerSize, null);
this.settings.bindProperty(Settings.BindingDirection.IN, "icon-control-size", "iconControlSize", this._setIconControlSize, null);
this.settings.bindProperty(Settings.BindingDirection.IN, "icon-hover-size", "iconHoverSize", this._setIconHoverSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-favorites", "showFavorites", this._setVisibleFavorites, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "favorites-lines", "favoritesLinesNumber", this._refreshFavs, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-hover-icon", "showHoverIcon", this._setVisibleHoverIcon, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-power-buttons", "showPowerButtons", this._setVisiblePowerButtons, null);
         
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
/*
    on_orientation_changed: function (orientation) {
      this.styleBackground = new St.BoxLayout();
      
/*      if(this._applet_context_menu._boxWrapper) {
         this._applet_context_menu._boxPointer.bin.remove_child(this._applet_context_menu._boxWrapper);
         this.styleBackground.add(this._applet_context_menu._boxWrapper);
      }
      this._applet_context_menu.actor = this.styleBackground.actor;//this._boxPointer.actor;*/
/*
        this.menu.destroy();
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        
        this.menu.actor.add_style_class_name('menu-background');
        this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
        this.menu._boxPointer.bin.remove_child(this.menu._boxWrapper);
       // this.styleBackground.add_actor(this.menu._boxWrapper);
        this.menu.actor = this.styleBackground;
        this.menuManager.addMenu(this.menu);
        this._display();
   },
*/ 
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

        if(actor._delegate instanceof FavoritesButtonExtended) {
           return this._navegateFavBox(symbol, actor);
        } else if(actor == this.powerButtons) {
           return this._navegateSysBox(symbol, actor);; 
        } else if(actor == this.hover.actor) {
           this._navegateHoverIcon(symbol, actor);
           return false;
        } else if(actor == this.hover.menu.actor) {
           this._navegateHoverMenu(symbol, actor);
           return false;
        } else if(this._activeContainer === null) {
           item_actor = this._navegationInit(symbol);
        } else if(this._activeContainer == this.applicationsBox) {
           item_actor = this._navegateAppBox(symbol, this._selectedItemIndex, this._selectedRowIndex);
        } else if(this._activeContainer == this.categoriesBox) {
           item_actor = this._navegateCatBox(symbol, this._selectedItemIndex);
        } else if (this.searchFilesystem && (this._fileFolderAccessActive || symbol == Clutter.slash)) {
           return this._searchFileSystem(symbol);
        }
        else {
            return false;
        }
        if(!item_actor || item_actor === this.searchEntry) {
            return false;
        }
        if(item_actor._delegate)
           item_actor._delegate.emit('enter-event');
        return true;
      }
      catch(e) {
        Main.notify("Error", e.message);
      }
   },

   _changeFocusElement: function(elementActive) {
      let activeElements = [this.hover.actor, this.powerButtons, this.favoritesScrollBox, this.searchEntry];
      let actors = [this.hover.actor, this.powerButtons, this.favoritesObj.getFirstElement(), this.searchEntry];
      let index = activeElements.indexOf(elementActive);
      let selected = index + 1;
      while((selected < activeElements.length)&&((!activeElements[selected])||(!activeElements[selected].visible))) {
         selected++;
      }
      if(selected != activeElements.length) {
         return actors[selected];
      }
      let selected = 0;
      while((selected < index)&&((!activeElements[selected])||(!activeElements[selected].visible))) {
         selected++;
      }
      return actors[selected];
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
      let item_actor;
      this._previousTreeSelectedActor = this.catBoxIter.getFirstVisible();
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      } else if((symbol == Clutter.KEY_Right)||(symbol == Clutter.KEY_Up)||(symbol == Clutter.KEY_Down)) {
         this._activeContainer = this.applicationsBox;
         item_actor = this.appBoxIter.getFirstVisible();
      }
      //global.stage.set_key_focus(this.powerButtons);
      this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
      this._selectedRowIndex = this.appBoxIter.getInternalIndexOfChild(item_actor);
      return item_actor;
   },

   _navegateAppBox: function(symbol, index, rowIndex) {
      let item_actor;
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if(symbol == Clutter.KEY_Up) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
            item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
            index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._scrollToButton(item_actor._delegate);
      } 
      else if(symbol == Clutter.KEY_Down) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Right) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getRightVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Left) {//&& !this.searchActive
         if(index == 0) {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
            item_actor = (this._previousTreeSelectedActor) ? this._previousTreeSelectedActor : this.catBoxIter.getFirstVisible();
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor = item_actor;
         } else {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
            item_actor = this.appBoxIter.getLeftVisible(this._previousSelectedActor);
            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
            index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._scrollToButton(item_actor._delegate);
         }
      } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         item_actor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
         item_actor._delegate.activate();
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateCatBox: function(symbol, index) {
      let item_actor;
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if(this.categoriesBox.get_vertical()) {
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
      } else {
         if(symbol == Clutter.KEY_Right) {
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
            this._previousTreeSelectedActor._delegate.isHovered = false;
            item_actor = this.catBoxIter.getNextVisible(this._activeActor)
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor._delegate.emit('leave-event');
            this._scrollToButtonCategories(item_actor._delegate);
         }
         else if(symbol == Clutter.KEY_Left) {
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
            this._previousTreeSelectedActor._delegate.isHovered = false;
            item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._scrollToButtonCategories(item_actor._delegate);
         }
         else if(symbol == Clutter.KEY_Down) {// && (this._activeContainer !== this.applicationsBox)
            if(this._previousVisibleIndex !== null) {
               item_actor = this.appBoxIter.getVisibleItem(this._previousVisibleIndex);
            } else {
               item_actor = this.appBoxIter.getFirstVisible();
            }
            index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         }
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateFavBox: function(symbol, actor) {
      this.fav_actor = actor;
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.favoritesScrollBox);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         return true;
      } else {
         this._scrollToButtonFav(this.favoritesObj.navegateFavBox(symbol, actor)._delegate);
         return true;
      }
   },

   _navegateSysBox: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         this.fav_actor = this._changeFocusElement(this.powerButtons);
         //global.stage.set_key_focus(this.fav_actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         if(this.sysButtSelected - 1 < 0)
            this.sysButtSelected = this._systemButtons.length -1;
         else
            this.sysButtSelected--;
         this._systemButtons[this.sysButtSelected].setActive(true);
         this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         if(this.sysButtSelected + 1 < this._systemButtons.length)
            this.sysButtSelected++;
         else
            this.sysButtSelected = 0;
         this._systemButtons[this.sysButtSelected].setActive(true);
         this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         if(this.sysButtSelected) {
            this._systemButtons[this.sysButtSelected].setActive(false);
            this._systemButtons[this.sysButtSelected].executeAction();
         }
      }
      return true;
   },

   _navegateHoverIcon: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.hover.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
   },

   _navegateHoverMenu: function(symbol, actor) {
      if((this.hover.account.active)&&(symbol == Clutter.KEY_Down)) {
         this.fav_actor = this.hover.notificationsSwitch.actor;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
   },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
   },

   _scrollToButton: function(button) {
        var current_scroll_value = this.applicationsScrollBox.get_vscroll_bar().get_adjustment().get_value();
        var box_height = this.applicationsScrollBox.get_allocation_box().y2-this.applicationsScrollBox.get_allocation_box().y1;
        var new_scroll_value = current_scroll_value;
        var alloc_box = button.actor.get_allocation_box();
        if (current_scroll_value > alloc_box.y1-10) new_scroll_value = alloc_box.y1-10;
        if (box_height+current_scroll_value < alloc_box.y2+10) new_scroll_value = alloc_box.y2-box_height+10;
        if (new_scroll_value!=current_scroll_value) this.applicationsScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
    },

   _scrollToButtonFav: function(button) {
      if(this.favoritesBox.get_vertical()) {
         var current_scroll_value = this.favoritesScrollBox.get_vscroll_bar().get_adjustment().get_value();
         var box_height = this.favoritesScrollBox.get_allocation_box().y2-this.favoritesScrollBox.get_allocation_box().y1;
         var new_scroll_value = current_scroll_value;
         if (current_scroll_value > button.actor.get_allocation_box().y1-10) new_scroll_value = button.actor.get_allocation_box().y1-10;
         if (box_height+current_scroll_value < button.actor.get_allocation_box().y2+10) new_scroll_value = button.actor.get_allocation_box().y2-box_height+10;
         if (new_scroll_value!=current_scroll_value) this.favoritesScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
      } else {
         var current_scroll_value = this.favoritesScrollBox.get_hscroll_bar().get_adjustment().get_value();
         var box_width = this.favoritesScrollBox.get_allocation_box().x2-this.favoritesScrollBox.get_allocation_box().x1;
         var new_scroll_value = current_scroll_value;
         if (current_scroll_value > button.actor.get_allocation_box().x1-10) new_scroll_value = button.actor.get_allocation_box().x1-10;
         if (box_width+current_scroll_value < button.actor.get_allocation_box().x2+10) new_scroll_value = button.actor.get_allocation_box().x2-box_width+10;
         if (new_scroll_value!=current_scroll_value) this.favoritesScrollBox.get_hscroll_bar().get_adjustment().set_value(new_scroll_value);
      }
   },

   _scrollToButtonCategories: function(button) {
      if(this.categoriesBox.get_vertical()) {
         var current_scroll_value = this.categoriesScrollBox.get_vscroll_bar().get_adjustment().get_value();
         var box_height = this.categoriesScrollBox.get_allocation_box().y2-this.categoriesScrollBox.get_allocation_box().y1;
         var new_scroll_value = current_scroll_value;
         if (current_scroll_value > button.actor.get_allocation_box().y1-10) new_scroll_value = button.actor.get_allocation_box().y1-10;
         if (box_height+current_scroll_value < button.actor.get_allocation_box().y2+10) new_scroll_value = button.actor.get_allocation_box().y2-box_height+10;
         if (new_scroll_value!=current_scroll_value) this.categoriesScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
      } else {
         var current_scroll_value = this.categoriesScrollBox.get_hscroll_bar().get_adjustment().get_value();
         var box_width = this.categoriesScrollBox.get_allocation_box().x2-this.categoriesScrollBox.get_allocation_box().x1;
         var new_scroll_value = current_scroll_value;
         if (current_scroll_value > button.actor.get_allocation_box().x1-10) new_scroll_value = button.actor.get_allocation_box().x1-10;
         if (box_width+current_scroll_value < button.actor.get_allocation_box().x2+10) new_scroll_value = button.actor.get_allocation_box().x2-box_width+10;
         if (new_scroll_value!=current_scroll_value) this.categoriesScrollBox.get_hscroll_bar().get_adjustment().set_value(new_scroll_value);
      }
   },

   _updateView: function() {
      try {
         let viewBox;
         let appBox = this.applicationsBox.get_children();
         let appItem;
         for(let i = 0; i < appBox.length; i++) {
            appItem = appBox[i].get_children();
            if(appItem) {
               for(let j = 0; j < appItem.length; j++)
                  appBox[i].remove_actor(appItem[j]);
               appBox[i].destroy();
               this.applicationsBox.remove_actor(appBox[i]);
            }
         }
//app
         let visibleAppButtons = new Array();
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(this._applicationsButtons[i].actor.visible) {
               this._applicationsButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._applicationsButtons[i]);
            }
         }
         for(let i = 0; i < this._placesButtons.length; i++) {
            if(this._placesButtons[i].actor.visible) {
               this._placesButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._placesButtons[i]);
            }
         }
         for(let i = 0; i < this._recentButtons.length; i++) {
            if(this._recentButtons[i].actor.visible) {
               this._recentButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._recentButtons[i]);
            }
         }
         for(let i = 0; i < this._transientButtons.length; i++) {
            if(this._transientButtons[i].actor.visible) {
               this._transientButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._transientButtons[i]);
            }
         }

         this.applicationsBox.set_vertical(false);

         let currValue, falseActor;
         for(let i = 0; i < this.iconViewCount; i++) {
            viewBox = new St.BoxLayout({ vertical: true });
            this.applicationsBox.add_actor(viewBox);
         }
         viewBox = this.applicationsBox.get_children();
         for(let i = 0; i < visibleAppButtons.length; i += this.iconViewCount) {
            for(let j = 0; j < this.iconViewCount; j++) {
               currValue = i + j;
               if(currValue < visibleAppButtons.length) {
                  viewBox[j].add_actor(visibleAppButtons[currValue].actor);   
                  if(visibleAppButtons[currValue].menu)
                     viewBox[j].add_actor(visibleAppButtons[currValue].menu.actor);
                  else {//Remplace menu actor by a hide false actor.
                     falseActor = new St.BoxLayout();
                     falseActor.hide();
                     viewBox[j].add_actor(falseActor);
                  }
               }
            }
         }
      } catch(e) {
        Main.notify("Error", e.message);
      }
   },

   _update_autoscroll: function() {
      this.applicationsScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this._setHorizontalAutoScroll(this.categoriesScrollBox, this.autoscroll_enabled);
   },

   _setIconMaxFavSize: function() {
      this._refreshApps();
      this._refreshFavs();
   },

   _setIconControlSize: function() {
      if((this.bttViewList)&&(this.bttViewList.get_children()[0]))
         this.bttViewList.get_children()[0].set_icon_size(this.iconControlSize);
      if((this.bttViewGrid)&&(this.bttViewGrid.get_children()[0]))
         this.bttViewGrid.get_children()[0].set_icon_size(this.iconControlSize);
   },

   _setIconPowerSize: function() {
      if(this._systemButtons) {
         for(let i = 0; i < this._systemButtons.length; i++)
            this._systemButtons[i].setIconSize(this.iconPowerSize);
      }
   },

   _setIconHoverSize: function() {
      if(this.hover)
         this.hover.setIconSize(this.iconHoverSize);
   },

   _setVisibleViewControl: function() {
      this.bttViewGrid.visible = this.showView;
      this.bttViewList.visible = this.showView;
   },

   _setVisibleFavorites: function() {
      this.favoritesScrollBox.visible = this.showFavorites;
     // this.favoritesObj.actor.visible = this.showFavorites;
      this._refreshFavs();
   },

   _setVisiblePowerButtons: function() {
      this.powerButtons.visible = this.showPowerButtons;
   },

   _setVisibleHoverIcon: function() {
      this.hover.actor.visible = this.showHoverIcon;
      if(this.hover.menu.actor.visible)
         this.hover.menu.actor.visible = this.showHoverIcon;
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
      this._setIconPowerSize();
      this._setIconHoverSize();
      this._display();
      this._setVisibleViewControl();
      this._setVisibleFavorites();
      this._setVisiblePowerButtons();
      this._setVisibleHoverIcon();
      this._updateClock();
      this._updateDate();
      this._update_autoscroll();
      //this._refreshPlacesAndRecent();
      this._updateActivateOnHover();
      this._updateIconAndLabel();
      this._update_hover_delay();
   },

   _updateHeight: function() {
      if(this.controlingHeight) {
        this.applicationsScrollBox.set_height(-1);
         this.betterPanel.set_height(this.height);
         if(this.favoritesObj.getVertical()) {
            if(this.scrollFavoritesVisible) {
               if(this.favBoxWrapper.get_parent() == this.betterPanel)
                  this.favBoxWrapper.set_height(this.height);
               else
                  this.favBoxWrapper.set_height(this.height +  this.searchBox.get_height());
               this.favoritesBox.set_height(-1);
            }
            else {
               if((this.favBoxWrapper.get_children().indexOf(this.powerButtons) != -1)&&(this.powerButtons.visible))
                  this.favoritesBox.set_height(this.height +  this.searchBox.get_height() - this.powerButtons.get_height());
               else {
                  if(this.favBoxWrapper.get_parent() == this.betterPanel)
                     this.favoritesBox.set_height(this.height);
                  else
                     this.favoritesBox.set_height(this.height +  this.searchBox.get_height());
               }
               this.favBoxWrapper.set_height(-1);
            }
         }
         if(this.categoriesBox.get_vertical()) {
            if(this.scrollApplicationsVisible) {
               this.applicationsScrollBox.set_height(this.height);
               this.applicationsBox.set_height(-1);
            }
            else
               this.applicationsBox.set_height(this.height);
            if(this.scrollCategoriesVisible)
               this.categoriesBox.set_height(-1);
            else
               this.categoriesBox.set_height(this.height);
         } else {
            if(this.scrollApplicationsVisible) {
               if(this.favoritesObj.getVertical())
                  this.applicationsScrollBox.set_height(this.height - this.categoriesScrollBox.get_height());
               else
                  this.applicationsScrollBox.set_height(this.height - this.categoriesScrollBox.get_height() - this.favoritesObj.actor.get_height());
               this.applicationsBox.set_height(-1);
            }
            else {
               if(this.favoritesObj.getVertical())
                  this.applicationsScrollBox.set_height(this.height - this.categoriesScrollBox.get_height());
               else
                  this.applicationsScrollBox.set_height(this.height - this.categoriesScrollBox.get_height() - this.favoritesObj.actor.get_height());
               this.applicationsBox.set_height(this.applicationsScrollBox.get_height());
            }
         }
      }
      else {
         let scrollBoxHeight;
         if(this.favBoxWrapper.get_parent() != this.betterPanel)
            scrollBoxHeight = 0.9*this.favBoxWrapper.get_height();
         else
            scrollBoxHeight =this.categoriesBox.get_height();
         if(this.categoriesBox.get_vertical()) {
            if(this.categoriesBox.get_height() > scrollBoxHeight)
               scrollBoxHeight = this.categoriesBox.get_height();
         }
         else
            scrollBoxHeight -= this.categoriesBox.get_height() + 40;

         if(scrollBoxHeight < 200)
            scrollBoxHeight = 200;
         this.applicationsScrollBox.set_height(scrollBoxHeight);
         if(this.favBoxWrapper.get_parent() == this.betterPanel)
            this.favBoxWrapper.set_height(scrollBoxHeight);
         else
            this.favBoxWrapper.set_height(-1);
         this.categoriesBox.set_height(-1);
         this.applicationsBox.set_height(-1);
         this.betterPanel.set_height(-1);
      }
   },

   _updateWidth: function() {
      if(!this.categoriesBox.get_vertical()) {
         if(!this.favoritesObj.getVertical()) {
            if(this.applicationsBox.get_width() < this.favBoxWrapper.get_width())
               this.applicationsBox.set_width(this.favBoxWrapper.get_width());
         }
         else {
            /*this.categoriesBox.set_width(80);
            this.applicationsBox.set_width(-1);*/
            let currWidth = this.applicationsBox.get_width();
            if(currWidth < this.endBox.get_width())
               currWidth = this.endBox.get_width();
            if(currWidth < this.searchBox.get_width()-10)
               currWidth = this.searchBox.get_width()-10;
         }
         this.categoriesBox.set_width(this.applicationsBox.get_width());
      }
      else {
         if(this.favBoxWrapper.get_parent() == this.betterPanel) {
            if((this._applicationsBoxWidth)&&(this._applicationsBoxWidth != 0))
               this.applicationsBox.set_width(this.iconViewCount*this._applicationsBoxWidth + 42); // The answer to life...
             /*if(this.favoritesScrollBox.get_width() > this.applicationsBox.get_width() + this.categoriesBox.get_width() + 20)
               this.applicationsBox.set_width(this.favoritesScrollBox.get_width() - this.categoriesBox.get_width() - 20);
             if(this.favoritesScrollBox.get_width() < this.applicationsBox.get_width() + this.categoriesBox.get_width() + 20)*/
            //this.favoritesScrollBox.set_width(this.applicationsBox.get_width() + this.categoriesBox.get_width() + 20);
            //this.favoritesBox.set_width(this.applicationsBox.get_width() + this.categoriesBox.get_width() + 20);
            if(this.favoritesScrollBox.get_width() > this.applicationsBox.get_width() + this.categoriesBox.get_width() + 20)
               this.applicationsBox.set_width(this.favoritesScrollBox.get_width() - this.categoriesBox.get_width() - 20);
            this.favoritesScrollBox.set_width(this.applicationsBox.get_width() + this.categoriesBox.get_width() + 20); 
         }
      }
   },
/*
   _internalHeight: function(pane) {
      let actors = pane.get_children();
      let result = 0;
      for(var i = 0; i < actors.length; i++) {
         result += actors[i].get_height(); 
      }
      return result;
   },
*/
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

   _createScroll: function(vertical) {
      let scrollBox;
      if(vertical) {
         scrollBox = new St.ScrollView({ x_fill: true, y_fill: false, y_align: St.Align.START, style_class: 'vfade menu-applications-scrollbox' });
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
      } else {
         scrollBox = new St.ScrollView({ x_fill: false, y_fill: true, x_align: St.Align.START, style_class: 'hfade menu-applications-scrollbox' });
         scrollBox.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.NEVER);
         let hscroll = scrollBox.get_hscroll_bar();
         hscroll.connect('scroll-start',
                          Lang.bind(this, function() {
                          this.menu.passEvents = true;
                       }));
         hscroll.connect('scroll-stop',
                          Lang.bind(this, function() {
                          this.menu.passEvents = false;
                       }));
      }
      return scrollBox;
   },

   _createSymbolicButton: function(icon) {
      let bttIcon = new St.Icon({icon_name: icon, icon_type: St.IconType.SYMBOLIC,
	                         style_class: 'popup-menu-icon', icon_size: this.iconControlSize});
      let btt = new St.Button({ child: bttIcon });
      this.controlView.add(btt, { x_fill: false, expand: false });
   
      btt.connect('notify::hover', Lang.bind(this, function(actor) {
         if(actor.get_hover()) {
            global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
            actor.set_style_class_name('menu-category-button-selected');
         }
         else {
            global.unset_cursor();
            actor.set_style_class_name('menu-category-button');
         }
      }));
      btt.set_style_class_name('menu-category-button');
      btt.set_style('padding: 0px;');
      return btt;
   },

   _display: function() {
      try {
         this.allowFavName = false;
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

         this.mainBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:false });

         this.rightPane = new St.BoxLayout({ vertical: true });        
//search
         this.searchBox = new St.BoxLayout({ vertical: false }); //style_class: 'menu-search-box',
         this.controlBox = new St.BoxLayout({ vertical: true });
         this.rightPane.add_actor(this.searchBox);

         this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                           hint_text: _("Type to search..."),
                                           track_hover: true,
                                           can_focus: true });
         this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

         this.searchBox.add(this.controlBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
         this.searchActive = false;
         this.searchEntryText = this.searchEntry.clutter_text;
         this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
         this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this._previousSearchPattern = "";

//view
         this.controlView = new St.BoxLayout({ vertical: false });
         this.bttViewList = this._createSymbolicButton('view-list-symbolic');
         this.bttViewList.connect('clicked', Lang.bind(this, function() {
            this.bttViewGrid.set_style('padding: 0px;');
            this.bttViewList.set_style('padding: 0px; border: 1px solid #ffffff;');
            this.iconView = false;
            this._refreshApps();
         }));
         this.controlView.add(this.bttViewList, { x_fill: false, expand: false });
         this.bttViewGrid = this._createSymbolicButton('view-grid-symbolic');
         this.bttViewGrid.connect('clicked', Lang.bind(this, function() {
            this.bttViewList.set_style('padding: 0px;');
            this.bttViewGrid.set_style('padding: 0px; border: 1px solid #ffffff;');
            this.iconView = true;
            this._refreshApps();
         }));
         this.controlView.add(this.bttViewGrid, { x_fill: false, expand: false });
         if(this.iconView)
            this.bttViewGrid.set_style('padding: 0px; border: 1px solid #ffffff;');
         else
            this.bttViewList.set_style('padding: 0px; border: 1px solid #ffffff;');
         this.timeDate = new TimeAndDate();
         this.controlView.add(this.timeDate.actor, {x_fill: false, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: true});
//view
         this.controlBox.add(this.controlView, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
         this.controlBox.add(this.searchEntry, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
//search

         this.hover = new HoverIcon(this, this.iconHoverSize);
         this.hover.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this.hover.menu.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));

         this.searchBox.add(this.hover.actor, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
         this.searchBox.add(this.hover.menu.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });

         this.categoriesApplicationsBox = new CategoriesApplicationsBoxExtended();
         this.rightPane.add_actor(this.categoriesApplicationsBox.actor);

         this.applicationsScrollBox = this._createScroll(true);

         this.categoriesBox = new St.BoxLayout({ style_class: 'menu-categories-box', vertical: true });
         this.applicationsBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:true });
         this.favBoxWrapper = new St.BoxLayout({ vertical: true });
         this.favoritesBox = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: true });

         this.a11y_settings = new Gio.Settings({ schema: "org.cinnamon.desktop.a11y.applications" });
         this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
         this._updateVFade();

         this.endBox = new St.BoxLayout({ vertical: false });
         this.selectedAppBox = new St.BoxLayout({ style_class: 'menu-selected-app-box', vertical: true });
         this.selectedAppTitle = new St.Label({ style_class: 'menu-selected-app-title', text: "" });
         this.selectedAppBox.add_actor(this.selectedAppTitle);
         this.selectedAppDescription = new St.Label({ style_class: 'menu-selected-app-description', text: "" });
         this.selectedAppBox.add_actor(this.selectedAppDescription);
         
         this.endBox.add(this.selectedAppBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
         this.endBox.set_style("padding-right: 20px;");

         this.betterPanel = new St.BoxLayout({ vertical: false });
         this.categoriesWrapper = new St.BoxLayout({ vertical: true });

         this.staticBox = new StaticBox(this, this.selectedAppTitle, this.selectedAppDescription, this.hover, false, 32);

         switch(this.theme) {
            case "classic"           :
                          this.loadClassic(); 
                          break;
            case "stylized"          :
                          this.loadStylized(); 
                          break;
            case "dragon"            :
                          this.loadDragon(); 
                          break;
            case "dragonInverted"    :
                          this.loadDragonInverted(); 
                          break;
            case "horizontal"        :
                          this.loadHorizontal(); 
                          break;
            case "accessible"        :
                          this.loadAccessible(); 
                          break;
            case "accessibleInverted":
                          this.loadAccessibleInverted(); 
                          break;
            case "mint":
                          this.loadMint(); 
                          break;

            default                  :
                          this.loadClassic(); 
                          break;
         }
         this.favoritesBox.add(this.favoritesObj.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
         this.favoritesScrollBox.add_actor(this.favoritesBox);

         this.categoriesWrapper.add_actor(this.categoriesScrollBox);
         this.categoriesScrollBox.add_actor(this.categoriesBox);
         this.applicationsScrollBox.add_actor(this.applicationsBox);

         this.categoriesApplicationsBox.actor.add_actor(this.betterPanel);

         this.appBoxIter = new VisibleChildIteratorExtended(this, this.applicationsBox, this.iconViewCount);
         this.applicationsBox._vis_iter = this.appBoxIter;
         this.catBoxIter = new VisibleChildIteratorExtended(this, this.categoriesBox, 1);
         this.categoriesBox._vis_iter = this.catBoxIter;

         this._refreshApps();

         this.signalKeyPowerID = 0;
         this._update_autoscroll();

         section.actor.add_actor(this.mainBox);
         section.actor.add_actor(this.endBox);

         Mainloop.idle_add(Lang.bind(this, function() {
            this._updateHeight();//Add by me
            this._updateWidth();
            this._clearAllSelections(true);
         }));
      } catch(e) {
         Main.notify("Error:", e.message);
      }
   },

   loadClassic: function() {
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.categoriesScrollBox = this._createScroll(true);
      this.favoritesScrollBox = this._createScroll(true);
      this.powerButtons = this._powerButtons(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favBoxWrapper.add(this.powerButtons, { y_align: St.Align.END, y_fill: false, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.END, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   loadStylized: function() {
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.categoriesScrollBox = this._createScroll(true);
      this.favoritesScrollBox = this._createScroll(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerButtons = this._powerButtons(false);
      this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   loadDragon: function() {
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.betterPanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.categoriesScrollBox = this._createScroll(false);
      this.favoritesScrollBox = this._createScroll(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      //this.categoriesScrollBox.hscrollbar_visible(false);
      this.powerButtons = this._powerButtons(false);
      this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   loadDragonInverted: function() {
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.betterPanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.categoriesScrollBox = this._createScroll(false);
      this.favoritesScrollBox = this._createScroll(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      //this.categoriesScrollBox.hscrollbar_visible(false);
      this.powerButtons = this._powerButtons(false);
      this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   loadHorizontal: function() {
      this.favoritesObj = new FavoritesBoxExtended(false, this.favoritesLinesNumber);
      this.betterPanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.categoriesScrollBox = this._createScroll(false);
      this.favoritesScrollBox = this._createScroll(true);
      //this.categoriesScrollBox.hscrollbar_visible(false);
      this.powerButtons = this._powerButtons(false);
      this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      //this.favoritesObj.setVertical(false);
     // this.rightPane.add(this.favBoxWrapper, { x_fill: false, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.favBoxWrapper, { x_fill: false, y_fill: false, expand: true });
      this.favBoxWrapper.set_vertical(false);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
     // let heightFav = this.favoritesObj.getRealSpace(); //MAX_FAV_ICON_SIZE*(this.favoritesLinesNumber+1) + 1;
     // this.favoritesBox.set_style('max-height: ' + heightFav + 'px; min-height: ' + heightFav + 'px');
   },

   loadAccessible: function() {
      this.searchBox.remove_actor(this.hover.actor);
      this.searchBox.remove_actor(this.hover.menu.actor);
      this.staticBox.takeHover(true);
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.categoriesScrollBox = this._createScroll(true);
      this.favoritesScrollBox = this._createScroll(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerButtons = this._powerButtons(false);
      //this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.staticBox.actor, { y_align: St.Align.START, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   loadAccessibleInverted: function() {
      this.searchBox.remove_actor(this.hover.actor);
      this.searchBox.remove_actor(this.hover.menu.actor);
      this.staticBox.takeHover(true);
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.categoriesScrollBox = this._createScroll(true);
      this.favoritesScrollBox = this._createScroll(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerButtons = this._powerButtons(false);
      //this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      this.mainBox.add(this.staticBox.actor, { y_align: St.Align.START, y_fill: false, expand: true });
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   loadMint: function() {
      this.allowFavName = true;
      this.searchBox.remove_actor(this.hover.actor);
      this.searchBox.remove_actor(this.hover.menu.actor);
      let btChanger = new ButtonChangerBox(_("All Applications"), "forward", this, false);
      this.searchBox.add(btChanger.actor, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.staticBox.takeHover(true);
      this.favoritesObj = new FavoritesBoxExtended(true, this.favoritesLinesNumber);
      this.categoriesScrollBox = this._createScroll(true);
      this.favoritesScrollBox = this._createScroll(true);
      this.favBoxWrapper.add(this.favoritesScrollBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerButtons = this._powerButtons(false);
      //this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.staticBox.actor, { y_align: St.Align.START, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.categoriesWrapper.visible = false;
      this.applicationsScrollBox.visible = false;
      //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.betterPanel.add(this.categoriesWrapper, { x_fill: false, expand: false });
      this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, y_fill: false, y_align: St.Align.START, expand: true });
   },

   _setHorizontalAutoScroll: function(hScroll, setValue) {
      if(hScroll) {
         let childrens = hScroll.get_children();
         if((childrens)&&(childrens[0])&&(!childrens[0].get_vertical())) {
            if(!this.hScrollSignals)
               this.hScrollSignals = new Array();
            let hScrollSignal = this.hScrollSignals[hScroll];
            if(((!hScrollSignal)||(hScrollSignal == 0))&&(setValue)) {
               this.hScrollSignals[hScroll] = hScroll.connect('motion-event', Lang.bind(this, this._onMotionEvent));
            }
            else if((hScrollSignal)&&(hScrollSignal > 0)&&(!setValue)) {
               this.hScrollSignals[hScroll] = null;
               hScroll.disconnect(hScrollSignal);
            }
         }
      }
   },

   _onMotionEvent: function(actor, event) {
      this.hScroll = actor;
      let dMin = 10;
      let dMax = 50;
      let [mx, my] = event.get_coords();
      let [ax, ay] = this.hScroll.get_transformed_position();
      let [ah, aw] = [this.hScroll.get_height(), this.hScroll.get_width()];
      if((my < ay + ah)&&(my > ay)&&((mx < ax + dMin)&&(mx > ax - dMax))||
         ((mx > ax + aw - dMin)&&(mx < ax + aw + dMax)))
         this._doHorizontalScroll();
   },

   _doHorizontalScroll: function() {
      if((this.hScrollSignals)&&(this.hScrollSignals[this.hScroll] > 0)) {
         let dMin = 10;
         let dMax = 50;
         let speed = 1;
         let [mx, my, mask] = global.get_pointer();
         let [ax, ay] = this.hScroll.get_transformed_position();
         let [ah, aw] = [this.hScroll.get_height(), this.hScroll.get_width()];
         if((my < ay + ah)&&(my > ay)) {
            if((mx < ax + dMin)&&(mx > ax - dMax)) {
               if(ax > mx)
                  speed = 20*speed*(ax - mx)/dMax;
               let val = this.hScroll.get_hscroll_bar().get_adjustment().get_value();
               this.hScroll.get_hscroll_bar().get_adjustment().set_value(val - speed);
               Mainloop.timeout_add(100, Lang.bind(this, this._doHorizontalScroll));
            }
            else if((mx > ax + aw - dMin)&&(mx < ax + aw + dMax)) {
               if(ax + aw < mx)
                  speed = 20*speed*(mx - ax - aw)/dMax;
               let val = this.hScroll.get_hscroll_bar().get_adjustment().get_value();
               this.hScroll.get_hscroll_bar().get_adjustment().set_value(val + speed);
               Mainloop.timeout_add(100, Lang.bind(this, this._doHorizontalScroll));
            }
         }
      }
   }, 

   _clearAllSelections: function(hide_apps) {
       for(let i = 0; i < this._applicationsButtons.length; i++) {
          this._applicationsButtons[i].actor.style_class = "menu-application-button";
          if(hide_apps) {
             this._applicationsButtons[i].actor.hide();
          }
       }
       let actors = this.categoriesBox.get_children();
       for(let i = 0; i < actors.length; i++){
          let actor = actors[i];
          actor.style_class = "menu-category-button";
          actor.show();
       }
    },

   _select_category: function(dir, categoryButton) {
      if(dir)
         this._displayButtons(this._listApplications(dir.get_menu_id()));
      else
         this._displayButtons(this._listApplications(null));
      this.closeApplicationsContextMenus(null, false);
   },

   _displayButtons: function(appCategory, places, recent, apps, autocompletes) {
      if(appCategory) {
         if(appCategory == "all") {
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(!this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = true;//.show();
               }
            }
         } else {
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(this._applicationsButtons[i].category.indexOf(appCategory) != -1) {
                  if(!this._applicationsButtons[i].actor.visible) {
                     this._applicationsButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._applicationsButtons[i].actor.visible) {
                     this._applicationsButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else if(apps) {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(apps.indexOf(this._applicationsButtons[i].name) != -1) {
               if(!this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = true;//.show();
               }
            } else {
               if(this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = false;//.hide();
               }
            }
         }
      } else {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(this._applicationsButtons[i].actor.visible) {
               this._applicationsButtons[i].actor.visible = false;//.hide();
            }
         }
      }
      if(places) {
         if(places == -1) {
            for(let i = 0; i < this._placesButtons.length; i++) {
               this._placesButtons[i].actor.visible = true;//.show();
            }
         } else {
            for(let i = 0; i < this._placesButtons.length; i++) {
               if(places.indexOf(this._placesButtons[i].button_name) != -1) {
                  if(!this._placesButtons[i].actor.visible) {
                     this._placesButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._placesButtons[i].actor.visible) {
                     this._placesButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else {
         for(let i = 0; i < this._placesButtons.length; i++) {
            if(this._placesButtons[i].actor.visible) {
               this._placesButtons[i].actor.visible = false;//.hide();
            }
         }
      }
      if(recent) {
         if(recent == -1) {
            for(let i = 0; i < this._recentButtons.length; i++) {
               if(!this._recentButtons[i].actor.visible) {
                  this._recentButtons[i].actor.visible = true;//.show();
               }
            }
         } else {
            for(let i = 0; i < this._recentButtons.length; i++) {
               if(recent.indexOf(this._recentButtons[i].button_name) != -1) {
                  if(!this._recentButtons[i].actor.visible) {
                     this._recentButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._recentButtons[i].actor.visible) {
                     this._recentButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else {
         for(let i = 0; i < this._recentButtons.length; i++) {
            if(this._recentButtons[i].actor.visible) {
               this._recentButtons[i].actor.visible = false;//.hide();
            }
         }
      }

      for(indexT in this._transientButtons) {
         if(this._transientButtons[indexT].actor.visible) {
            this._appLeaveEvent(0, 0, this._transientButtons[indexT]);
            this._transientButtons[indexT].actor.visible = false;//.hide();
         }
      }

      if(autocompletes) {
         let viewBox;
         for(let i = 0; i < autocompletes.length; i++) {
            let button = new TransientButtonExtended(this, autocompletes[i], this.iconAppSize);
            button.actor.connect('realize', Lang.bind(this, this._onApplicationButtonRealized));
            button.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, button));
            this._addEnterEvent(button, Lang.bind(this, this._appEnterEvent, button));
            this._transientButtons.push(button);
            button.actor.visible = true;
            button.actor.realize();
            if(!this.iconView) {
               button.setVertical(this.iconView);
               viewBox = new St.BoxLayout({ vertical: true });
               viewBox.add_actor(button.actor);
               this.applicationsBox.add_actor(viewBox);
            }
         }
      }
      this._updateView();
   },

   _onApplicationButtonRealized: function(actor) {
      if(actor.get_width() > this._applicationsBoxWidth) {
         this._applicationsBoxWidth = actor.get_width();
         this.applicationsBox.set_width(this.iconViewCount*this._applicationsBoxWidth + 42); // The answer to life...
      }
/*    if(this.searchBox.get_width() > this.applicationsScrollBox.get_width())
         this.applicationsScrollBox.set_width(this.searchBox.get_width());
      if(this.endBox.get_width() > this.applicationsScrollBox.get_width())
         this.applicationsScrollBox.set_width(this.searchBox.get_width());
      this.categoriesBox.set_width(this.applicationsScrollBox.get_width());*/
      this._updateHeight();
      this._updateWidth();
   },

   _refreshFavs: function() {
      //Remove all favorites
     /* this.favoritesBox.get_children().forEach(Lang.bind(this, function (child) {
          child.destroy();
      }));

      let favoritesBox = new CinnamonMenu.FavoritesBox();
      this.favoritesBox.add_actor(favoritesBox.actor);*/
      this.favoritesScrollBox.set_width(-1)
      this.favoritesBox.set_width(-1);
      this.favoritesObj.removeAll();
      if(this.favoritesObj.getNumberLines() != this.favoritesLinesNumber)
         this.favoritesObj.setNumberLines(this.favoritesLinesNumber);
         
      //Load favorites again
      this._favoritesButtons = new Array();
      let launchers = global.settings.get_strv('favorite-apps');
      let appSys = Cinnamon.AppSystem.get_default();
      let j = 0;
      for(let i = 0; i < launchers.length; ++i) {
         let app = appSys.lookup_app(launchers[i]);
         if(app) {
            let button = new FavoritesButtonExtended(this, this.favoritesObj.getVertical(), app,
                                                     launchers.length/this.favoritesLinesNumber,
                                                     this.iconMaxFavSize, this.allowFavName);
            // + 3 because we're adding 3 system buttons at the bottom
            //button.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(4)+"px;padding-right: "+(-5)+"px;margin:auto;";
            this._favoritesButtons[app] = button;
            this.favoritesObj.add(button.actor, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            //favoritesBox.actor.add(button.actor, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            button.actor.connect('enter-event', Lang.bind(this, function() {
               this._clearPrevCatSelection();
               this.selectedAppTitle.set_text(button.app.get_name());
               this.hover.refreshApp(button.app);
               if(button.app.get_description()) this.selectedAppDescription.set_text(button.app.get_description().split("\n")[0]);
                  else this.selectedAppDescription.set_text("");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
               this.hover.refreshFace();
            }));
            button.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            ++j;
         }
      }
   },

   _refreshApps : function() {
      this.applicationsBox.destroy_all_children();
      this._applicationsButtons = new Array();
      this._transientButtons = new Array();
      this._categoryButtons = new Array();
      this._applicationsButtonFromApp = new Object(); 
      this._applicationsBoxWidth = 0;
      this._activeContainer = null;
      this.favoritesScrollBox.set_width(-1);
      //Remove all categories
      this.categoriesBox.destroy_all_children();

      this._allAppsCategoryButton = new CategoryButtonExtended(null, this.iconCatSize);
      this._addEnterEvent(this._allAppsCategoryButton, Lang.bind(this, function() {
         if(!this.searchActive) {
            this._allAppsCategoryButton.isHovered = true;
            if(this.hover_delay > 0) {
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this._allAppsCategoryButton.isHovered) {
                        this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
                        this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
                        this._select_category(null, this._allAppsCategoryButton);
                     } else {
                        this._allAppsCategoryButton.actor.style_class = "menu-category-button";
                     }
                  }
               });
            } else {
               this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
               this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
               this._select_category(null, this._allAppsCategoryButton);
            }
            this.makeVectorBox(this._allAppsCategoryButton.actor);
         }
      }));
      this._allAppsCategoryButton.actor.connect('leave-event', Lang.bind(this, function () {
         this._previousSelectedActor = this._allAppsCategoryButton.actor;
         this._allAppsCategoryButton.isHovered = false;
      }));
      this.categoriesBox.add_actor(this._allAppsCategoryButton.actor);
      this._categoryButtons.push(this._allAppsCategoryButton);

      let trees = [appsys.get_tree()];

      for(var i in trees) {
         let tree = trees[i];
         let root = tree.get_root_directory();
            
         let iter = root.iter();
         let nextType;
         while((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
            if(nextType == GMenu.TreeItemType.DIRECTORY) {
               let dir = iter.get_directory();
               if(dir.get_is_nodisplay())
                  continue;
               if(this._loadCategory(dir)) {
                  let categoryButton = new CategoryButtonExtended(dir, this.iconCatSize);
                  this._addEnterEvent(categoryButton, Lang.bind(this, function() {
                     if(!this.searchActive) {
                        categoryButton.isHovered = true;
                        if(this.hover_delay > 0) {
                           Tweener.addTween(this, {
                              time: this.hover_delay, onComplete: function () {
                                 if(categoryButton.isHovered) {
                                    this._clearPrevCatSelection(categoryButton.actor);
                                    categoryButton.actor.style_class = "menu-category-button-selected";
                                    this._select_category(dir, categoryButton);
                                 } else {
                                    categoryButton.actor.style_class = "menu-category-button";
                                 }
                              }
                           });
                        } else {
                           this._clearPrevCatSelection(categoryButton.actor);
                           categoryButton.actor.style_class = "menu-category-button-selected";
                           this._select_category(dir, categoryButton);
                        }
                        this.makeVectorBox(categoryButton.actor);
                     }
                  }));
                  categoryButton.actor.connect('leave-event', Lang.bind(this, function () {
                     if(this._previousTreeSelectedActor === null) {
                        this._previousTreeSelectedActor = categoryButton.actor;
                     } else {
                        let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                        let nextIdx = this.catBoxIter.getVisibleIndex(categoryButton.actor);
                        if(Math.abs(prevIdx - nextIdx) <= 1) {
                           this._previousTreeSelectedActor = categoryButton.actor;
                        }
                     }
                     categoryButton.isHovered = false;
                  }));
                  this.categoriesBox.add_actor(categoryButton.actor);
                  this._categoryButtons.push(categoryButton);
               }
            }
         } 
      }
      // Sort apps and add to applicationsBox
      this._applicationsButtons.sort(function(a, b) {
         let sr = a.app.get_name().toLowerCase() > b.app.get_name().toLowerCase();
         return sr;
      });

      this._refreshPlacesAndRecent();

      Mainloop.idle_add(Lang.bind(this, function() {
      try {
         if(!this.categoriesBox.get_vertical()) {
            for(let i = 0; i < this._categoryButtons.length; i++) {
               this._categoryButtons[i].setVertical(true);
            }
         }
         this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
         this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
         this._select_category(null, this._allAppsCategoryButton);
         this.appBoxIter.setNumberView(this.iconViewCount);
      } catch(e) {Main.notify("errr", e.message);}
      }));
   },

   _refreshPlacesAndRecent : function() {
      for(let i = 0; i < this._placesButtons.length; i ++) {
         this._placesButtons[i].actor.destroy();
      }
      for(let i = 0; i < this._recentButtons.length; i ++) {
         this._recentButtons[i].actor.destroy();
      }
      for(let i = 0; i < this._categoryButtons.length; i++) {
         if(this._categoryButtons[i] instanceof CinnamonMenu.PlaceCategoryButton ||
            this._categoryButtons[i] instanceof CinnamonMenu.RecentCategoryButton) {
            this._categoryButtons[i].actor.destroy();
         }
      }
      this._placesButtons = new Array();
      this._recentButtons = new Array();

      // Now generate Places category and places buttons and add to the list
      if(this.showPlaces) {
         this.placesButton = new PlaceCategoryButtonExtended(null, this.iconCatSize);
         this._addEnterEvent(this.placesButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.placesButton.isHovered = true;
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this.placesButton.isHovered) {
                        this._clearPrevCatSelection(this.placesButton);
                        this.placesButton.actor.style_class = "menu-category-button-selected";
                        this._displayButtons(null, -1);
                     }
                  }
               });
               this.makeVectorBox(this.placesButton.actor);
            }
         }));
         this.placesButton.actor.connect('leave-event', Lang.bind(this, function () {
            if(this._previousTreeSelectedActor === null) {
               this._previousTreeSelectedActor = this.placesButton.actor;
            } else {
               let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
               let nextIdx = this.catBoxIter.getVisibleIndex(this.placesButton.actor);
               let idxDiff = Math.abs(prevIdx - nextIdx);
               let numVisible = this.catBoxIter.getNumVisibleChildren();
               if(idxDiff <= 1 || Math.min(prevIdx, nextIdx) < 0) {
                  this._previousTreeSelectedActor = this.placesButton.actor;
               }
            }

            this.placesButton.isHovered = false;
         }));
         this._categoryButtons.push(this.placesButton);
         this.categoriesBox.add_actor(this.placesButton.actor);

         let bookmarks = this._listBookmarks();
         let devices = this._listDevices();
         let places = bookmarks.concat(devices);
         for(let i = 0; i < places.length; i++) {
            let place = places[i];
            let button = new PlaceButtonExtended(this, place, place.name, this.iconView, this.iconAppSize);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppTitle.set_text("");
               this.hover.refreshPlace(button.place);
               this.selectedAppDescription.set_text(button.place.id.slice(16));
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this._previousSelectedActor = button.actor;
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
               this.hover.refreshFace();
            }));
            this._placesButtons.push(button);
         }
      }
      // Now generate recent category and recent files buttons and add to the list
      if(this.showRecent) {
         this.recentButton = new RecentCategoryButtonExtended(null, this.iconCatSize);
         this._addEnterEvent(this.recentButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.recentButton.isHovered = true;
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this.recentButton.isHovered) {
                        this._clearPrevCatSelection(this.recentButton.actor);
                        this.recentButton.actor.style_class = "menu-category-button-selected";
                        this._displayButtons(null, null, -1);
                     }
                  }
               });
               this.makeVectorBox(this.recentButton.actor);
            }
         }));
         this.recentButton.actor.connect('leave-event', Lang.bind(this, function () {  
            if(this._previousTreeSelectedActor === null) {
               this._previousTreeSelectedActor = this.recentButton.actor;
            } else {
               let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
               let nextIdx = this.catBoxIter.getVisibleIndex(this.recentButton.actor);
               let numVisible = this.catBoxIter.getNumVisibleChildren();
                    
               if(Math.abs(prevIdx - nextIdx) <= 1) {
                  this._previousTreeSelectedActor = this.recentButton.actor;
               }
            }
            this.recentButton.isHovered = false;
         }));

         this.categoriesBox.add_actor(this.recentButton.actor);
         this._categoryButtons.push(this.recentButton);

         for(let id = 0; id < MAX_RECENT_FILES && id < this.RecentManager._infosByTimestamp.length; id++) {
            let button = new RecentButtonExtended(this, this.RecentManager._infosByTimestamp[id], this.iconView, this.iconAppSize);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text(button.file.uri.slice(7));
               this.hover.refreshFile(button.file);
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
               this.hover.refreshFace();
            }));
            this._recentButtons.push(button);
         }
         if(this.RecentManager._infosByTimestamp.length > 0) {
            let button = new RecentClearButtonExtended(this, this.iconView, this.iconAppSize);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.hover.refresh("edit-clear");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.hover.refreshFace();
            }));
            this._recentButtons.push(button);
         }
      }
      this._setCategoriesButtonActive(!this.searchActive);
   },

//systemButtons
   _powerButtons: function(verticalPane) {        
      //Separator
      /*if(launchers.length!=0){
         let separator = new PopupMenu.PopupSeparatorMenuItem();
         powerButton.add_actor(separator.actor, { y_align: St.Align.END, y_fill: false });                   
      }*/
      let powerButtons = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: verticalPane });
      this._systemButtons = new Array();
      powerButtons.connect('key-focus-in', Lang.bind(this, function(actor, event) {        
         if(this._systemButtons.length > 0) {
            if(!this.sysButtSelected)
               this.sysButtSelected = 0;
            this._systemButtons[this.sysButtSelected].setActive(true);
            if(this.signalKeyPowerID == 0)
               this.signalKeyPowerID = powerButtons.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         }
      }));
      powerButtons.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         for(let cSys in this._systemButtons)
            this._systemButton[cSys].setActive(false);
         if(this.signalKeyPowerID > 0)
            powerButtons.disconnect(this.signalKeyPowerID);
      }));
      //Lock screen
      let button = new SystemButton(this, "gnome-lockscreen", _("Lock screen"), _("Lock the screen"), this.hover, this.iconPowerSize, false);
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));
      button.setAction(Lang.bind(this, this._onLockScreenAction));     
        
      powerButtons.add_actor(button.actor);
      this._systemButtons.push(button);
        
      //Logout button
      button = new SystemButton(this, "gnome-logout", _("Logout"), _("Leave the session"), this.hover, this.iconPowerSize, false);        
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));
      button.setAction(Lang.bind(this, this._onLogoutAction));

      powerButtons.add_actor(button.actor, { y_align: St.Align.END, y_fill: false }); 
      this._systemButtons.push(button);

      //Shutdown button
      button = new SystemButton(this, "gnome-shutdown", _("Quit"), _("Shutdown the computer"), this.hover, this.iconPowerSize, false);        
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent)); 
      button.setAction(Lang.bind(this, this._onShutdownAction));
        
      powerButtons.add_actor(button.actor, { y_align: St.Align.END, y_fill: false });
      this._systemButtons.push(button);
      return powerButtons;
   },

   _sysButtonEnterEvent: function(actor, event) {
      this.old_active_item_actor = this._activeActor;

      this.applicationsScrollBox.set_auto_scrolling(false);
      this.categoriesScrollBox.set_auto_scrolling(false);
      //this.favoritesScrollBox.set_auto_scrolling(false);
    
      let index = this._indexOfSysButton(actor);
      this.selectedAppTitle.set_text(this._systemButtons[index].title);
      this.selectedAppDescription.set_text(this._systemButtons[index].description);
      this.hover.refresh(this._systemButtons[index].icon);
   },

   _sysButtonLeaveEvent: function(actor, event) {
      this._scrollToButton(this.old_active_item_actor._delegate);
      this.applicationsScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
     // this.favoritesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.selectedAppTitle.set_text("");
      this.selectedAppDescription.set_text("");
      this.hover.refreshFace();
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
//systemButtons
   _appLeaveEvent: function(a, b, applicationButton) {
      this._previousSelectedActor = applicationButton.actor;
      applicationButton.actor.style_class = "menu-application-button";
      this.selectedAppTitle.set_text("");
      this.selectedAppDescription.set_text("");
      this.hover.refreshFace();
   },

   _appEnterEvent: function(applicationButton) {
      this.selectedAppTitle.set_text(applicationButton.app.get_name());
      if(applicationButton.app.get_description())
         this.selectedAppDescription.set_text(applicationButton.app.get_description());
      else
         this.selectedAppDescription.set_text("");
      this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(applicationButton.actor);
      this._clearPrevAppSelection(applicationButton.actor);
      applicationButton.actor.style_class = "menu-application-button-selected";
      this.hover.refreshApp(applicationButton.app);
   },

   _addEnterEvent: function(button, callback) {
      let _callback = Lang.bind(this, function() {
         try {
            let parent = button.actor.get_parent();
            if((parent)&&(parent != this.categoriesBox))
               parent = parent.get_parent();
            if(this._activeContainer !== this.applicationsBox && parent !== this._activeContainer) {
               this._previousTreeItemIndex = this._selectedItemIndex;
               this._previousTreeSelectedActor = this._activeActor;
               this._previousSelectedActor = null;
            }
            if(this._previousTreeSelectedActor && this._activeContainer !== this.categoriesBox &&
               parent !== this._activeContainer && button !== this._previousTreeSelectedActor) {
               this._previousTreeSelectedActor.style_class = "menu-category-button";
            }
            if((parent)&&(parent != this._activeContainer)) {
                parent._vis_iter.reloadVisible();
            }
            let _maybePreviousActor = this._activeActor;
            if(_maybePreviousActor && this._activeContainer === this.applicationsBox) {
               this._previousSelectedActor = _maybePreviousActor;
               this._clearPrevAppSelection();
            }
            if(parent === this.categoriesBox && !this.searchActive) {
               this._previousSelectedActor = _maybePreviousActor;
               this._clearPrevCatSelection();
            }
            this._activeContainer = parent;
            this._activeActor = button.actor;
            if(this._activeContainer) {
               this._selectedItemIndex = this._activeContainer._vis_iter.getAbsoluteIndexOfChild(this._activeActor);
               this._selectedRowIndex = this._activeContainer._vis_iter.getInternalIndexOfChild(this._activeActor);
            }
            callback();
         } catch(e) {
            Main.notify("error3", e.message);
         }
      });
      button.connect('enter-event', _callback);
      button.actor.connect('enter-event', _callback);
   },

   _loadCategory: function(dir, top_dir) {
      var iter = dir.iter();
      var has_entries = false;
      var nextType;
      if(!top_dir) top_dir = dir;
      while((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
         if(nextType == GMenu.TreeItemType.ENTRY) {
            var entry = iter.get_entry();
            if(!entry.get_app_info().get_nodisplay()) {
               has_entries = true;
               var app = appsys.lookup_app_by_tree_entry(entry);
               if(!app)
                  app = appsys.lookup_settings_app_by_tree_entry(entry);
               var app_key = app.get_id()
               if(app_key == null) {
                  app_key = app.get_name() + ":" + 
                  app.get_description();
               }
               if(!(app_key in this._applicationsButtonFromApp)) {
                  let applicationButton = new ApplicationButtonExtended(this, app, this.iconView, this.iconAppSize, this.iconMaxFavSize);
                  this._applicationsButtons.push(applicationButton);
                  applicationButton.actor.connect('realize', Lang.bind(this, this._onApplicationButtonRealized));
                  applicationButton.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, applicationButton));
                  this._addEnterEvent(applicationButton, Lang.bind(this, this._appEnterEvent, applicationButton));
                  applicationButton.category.push(top_dir.get_menu_id());
                  this._applicationsButtonFromApp[app_key] = applicationButton;
               } else {
                  this._applicationsButtonFromApp[app_key].category.push(dir.get_menu_id());
               }
            }
         } else if (nextType == GMenu.TreeItemType.DIRECTORY) {
            let subdir = iter.get_directory();
            if(this._loadCategory(subdir, top_dir)) {
               has_entries = true;
            }
         }
      }
      return has_entries;
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
         this.sysButtSelected = 0;
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
         this.actor.remove_style_pseudo_class('active');
         if(this.searchActive) {
            this.resetSearch();
         }
         this.selectedAppTitle.set_text("");
         this.selectedAppDescription.set_text("");
         this.hover.refreshFace();
         this._previousTreeItemIndex = null;
         this._previousTreeSelectedActor = null;
         this._previousSelectedActor = null;
         this.closeApplicationsContextMenus(null, false);
         this._clearAllSelections(false);
         this._refreshFavs();
         this.destroyVectorBox();
         this._systemButtons[this.sysButtSelected].setActive(false);
         this.timeDate.closeTimer();
      }
   }
};

function main(metadata, orientation, panel_height, instance_id) {  
    let myApplet = new MyApplet(orientation, panel_height, instance_id);
    return myApplet;      
}
