// Applet : Configurable Menu      Version      : v0.8-Beta
// O.S.   : Cinnamon               Release Date : 03 january 2014.
// Author : Lester Carballo Pérez  Email        : lestcape@gmail.com
//
// Website : https://github.com/lestcape/Configurable-Menu
//
// Thanks for all contribution to:
// Garibaldo: https://github.com/Garibaldo
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
const BoxPointer = imports.ui.boxpointer;

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

function ScrollItemsBox(parent, panelToScroll, vertical) {
   this._init(parent, panelToScroll, vertical);
}

ScrollItemsBox.prototype = {
   _init: function(parent, panelToScroll, vertical) {
      this.parent = parent;
      this.idSignalAlloc = 0;
      this.panelToScroll = panelToScroll;
      this.vertical = vertical;
      this.actor = new St.BoxLayout({ vertical: this.vertical });
      this.panelWrapper = new St.BoxLayout({ vertical: this.vertical });
      this.panelWrapper.add_actor(this.panelToScroll);

      this.scroll = this._createScroll(this.vertical);
      this.scroll.add_actor(this.panelWrapper);

      this.actor.add(this.scroll, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
   },

   _createScroll: function(vertical) {
      let scrollBox;
      if(vertical) {
         scrollBox = new St.ScrollView({ x_fill: true, y_fill: false, y_align: St.Align.START, style_class: 'vfade menu-applications-scrollbox' });
         scrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
         let vscroll = scrollBox.get_vscroll_bar();
         vscroll.connect('scroll-start',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = true;
                       }));
         vscroll.connect('scroll-stop',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = false;
                       }));
      } else {
         scrollBox = new St.ScrollView({ x_fill: false, y_fill: true, x_align: St.Align.START, style_class: 'hfade menu-applications-scrollbox' });
         scrollBox.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.NEVER);
         let hscroll = scrollBox.get_hscroll_bar();
         hscroll.connect('scroll-start',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = true;
                       }));
         hscroll.connect('scroll-stop',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = false;
                       }));
      }
      return scrollBox;
   },

   _onAllocationChanged: function(actor, event) {
      if(this.visible) {
         let w = this.panelToScroll.get_allocation_box().x2-this.panelToScroll.get_allocation_box().x1
         if((!this.vertical)&&(this.actor.get_width() > w)) {
            this.scroll.get_hscroll_bar().visible = false;
         } else {
            this.scroll.get_hscroll_bar().visible = true;
         }
      }   
   },

//horizontalcode
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
//horizontalcode
   setAutoScrolling: function(autoScroll) {
      if(this.vertical)
         this.scroll.set_auto_scrolling(autoScroll);
      else
         this._setHorizontalAutoScroll(this.scroll, autoScroll);
   },

   setScrollVisible: function(visible) {
      this.visible = visible;
      if(this.vertical)
         this.scroll.get_vscroll_bar().visible = visible;
      else {
         if((visible)&&(this.idSignalAlloc == 0))
            this.idSignalAlloc = this.actor.connect('allocation_changed', Lang.bind(this, this._onAllocationChanged));
         else if(this.idSignalAlloc > 0) {
            this.actor.disconnect(this.idSignalAlloc);
            this.idSignalAlloc = 0;
         }
         this.scroll.get_hscroll_bar().visible = visible;
      }
   },

   scrollToActor: function(actor) {
    try {
      if(this.vertical) {
         var current_scroll_value = this.scroll.get_vscroll_bar().get_adjustment().get_value();
         var box_height = this.actor.get_allocation_box().y2-this.actor.get_allocation_box().y1;
         var new_scroll_value = current_scroll_value;
         let hActor = this._getAllocationActor(actor, 0);
         if (current_scroll_value > hActor-10) new_scroll_value = hActor-10;
         if (box_height+current_scroll_value < hActor + actor.get_height()+10) new_scroll_value = hActor + actor.get_height()-box_height+10;
         if (new_scroll_value!=current_scroll_value) this.scroll.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
      } else {
         var current_scroll_value = this.scroll.get_hscroll_bar().get_adjustment().get_value();
         var box_width = this.actor.get_allocation_box().x2-this.actor.get_allocation_box().x1;
         var new_scroll_value = current_scroll_value;
         if (current_scroll_value > actor.get_allocation_box().x1-10) new_scroll_value = actor.get_allocation_box().x1-10;
         if (box_width+current_scroll_value < actor.get_allocation_box().x2+40) new_scroll_value = actor.get_allocation_box().x2-box_width+40;
         if (new_scroll_value!=current_scroll_value) this.scroll.get_hscroll_bar().get_adjustment().set_value(new_scroll_value);
      }
     } catch(e) {
        Main.notify("ScrollError", e.message);
     }
   },

   _getAllocationActor: function(actor, currHeight) {
      let actorParent = actor.get_parent();
      if((actorParent != null)&&(actorParent != this.parent)) {
         if(actorParent != this.panelToScroll) {
            return this._getAllocationActor(actorParent, currHeight + actor.get_allocation_box().y1);
         } else {
            return currHeight + actor.get_allocation_box().y1;
         }
      }
      return 0;//Some error
   }
};

function StaticBox(parent, hoverIcon, selectedAppBox, controlBox, powerBox, vertical, iconSize) {
   this._init(parent, hoverIcon, selectedAppBox, controlBox, powerBox, vertical, iconSize);
}

StaticBox.prototype = {
   _init: function(parent, hoverIcon, selectedAppBox, controlBox, powerBox, vertical, iconSize) {
      this.actor = new St.BoxLayout({ vertical: true });
      this.placeName = new St.Label({ style_class: 'menu-selected-app-title', text: _("Places"), visible: false });
      this.systemName = new St.Label({ style_class: 'menu-selected-app-title', text: _("System"), visible: false });
      this.placeName.style="font-size: " + 10 + "pt";
      this.systemName.style="font-size: " + 10 + "pt";
      this.hoverBox = new St.BoxLayout({ vertical: false });
      this.actor.add_actor(this.hoverBox);
      this.controlBox = new St.BoxLayout({ vertical: false });
      this.controlBox.set_style("padding-left: 30px;padding-right: 30px;");
      this.actor.add_actor(this.controlBox);
      this.itemsBox = new St.BoxLayout({ vertical: true });
      this.itemsBox.set_style("padding-left: 10px;");
      this.itemsPlaces = new AccessibleDropBox(this, true).actor;
      this.itemsSystem = new AccessibleDropBox(this, false).actor;
      this.itemsBox.add_actor(this.placeName);
      this.itemsBox.add_actor(this.itemsPlaces);
      this.spacerMiddle = new SeparatorBox(false, 20);// St.BoxLayout({ vertical: false, height: 20 });
      this.itemsBox.add_actor(this.spacerMiddle.actor);
      this.itemsBox.add_actor(this.systemName);
      this.itemsBox.add_actor(this.itemsSystem);
      this.scrollActor = new ScrollItemsBox(parent, this.itemsBox, true);
      this.spacerTop = new SeparatorBox(false, 20);//St.BoxLayout({ vertical: false, height: 20 });
      this.actor.add_actor(this.spacerTop.actor);
      this.actor.add(this.scrollActor.actor, {y_fill: true, expand: true});
      this.actor._delegate = this;

      this._staticSelected = -1;
      this.parent = parent;
      this.accessibleMetaData = parent.accessibleMetaData;
      this.hover = hoverIcon;
      this.selectedAppBox = selectedAppBox;
      this.control = controlBox;
      this.powerBox = powerBox;
      this.vertical = vertical;
      this.iconSize = iconSize;
      this.iconsVisible = true;
      this.takingHover = false;
      this.takeHover(true);
      this.takeControl(true);
      this.refreshAccessibleItems();

      this.takePower(true);
      this.actor.connect('key-focus-in', Lang.bind(this, function(actor, event) {
         if((this._staticButtons.length > 0)&&(this._staticSelected == -1))
            this._staticSelected = 0;
         this.activeSelected();
      }));
      this.actor.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         this.disableSelected();
      }));
   },

   setSeparatorSpace: function(space) {
      this.spacerMiddle.setSpace(space);
      this.spacerTop.setSpace(space);
   },

   setSeparatorLine: function(haveLine) {
      this.spacerMiddle.setLineVisible(haveLine);
      this.spacerTop.setLineVisible(haveLine);
   },

   setNamesVisible: function(visible) {
      this.placeName.visible = true;
      this.systemName.visible = true;
   },

   setIconsVisible: function(visible) {
      this.iconsVisible = visible;
      for(let i = 0; i < this._staticButtons.length; i++) {
         this._staticButtons[i].setIconVisible(visible);
      }
   },

   setSpecialColor: function(specialColor) {
      if(specialColor)
         this.actor.set_style_class_name('menu-favorites-box');
      else
         this.actor.set_style_class_name('');
   },

   acceptDrop: function(source, actor, x, y, time) {
      if(source instanceof FavoritesButtonExtended) {
         source.actor.destroy();
         actor.destroy();
         AppFavorites.getAppFavorites().removeFavorite(source.app.get_id());
         return true;
      }
      return false;
   },

   closeContextMenus: function(excludeApp, animate) {
      for(var app in this._staticButtons) {
         if((app!=excludeApp)&&(this._staticButtons[app].menu)&&(this._staticButtons[app].menu.isOpen)) {
            if(animate)
               this._staticButtons[app].toggleMenu();
            else
               this._staticButtons[app].closeMenu();
         }
      }
   },

   takeHover: function(take) {
      let parent = this.hover.actor.get_parent();
      if(parent) {
         parent.remove_actor(this.hover.actor);
         parent.remove_actor(this.hover.menu.actor);
      }
      if(take) {
         this.hoverBox.add(this.hover.actor, { x_fill: false, x_align: St.Align.MIDDLE, expand: true });
         this.hoverBox.add_actor(this.hover.menu.actor);
      }
   },

   takeControl: function(take) {
      if(take) {
         this.controlBox.add(this.control.actor, { x_fill: true, x_align: St.Align.MIDDLE, expand: true });
      }
      else if(this.control.actor.get_parent() == this.controlBox) {
         this.controlBox.remove_actor(this.control.actor);
      }
   },

   takePower: function(take) {
      if(take) {
         if(this.actor.get_children().indexOf(this.powerBox.actor) == -1)
            this.actor.add(this.powerBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.END, expand: true });
      }
      else if(this.powerBox.actor.get_parent() == this.actor) {
         this.actor.remove_actor(this.powerBox.actor);
      }
   },

   setAutoScrolling: function(autoScroll) {
      this.scrollActor.setAutoScrolling(autoScroll);
   },

   setScrollVisible: function(visible) {
      this.scrollActor.setScrollVisible(visible);
   },

   getFirstElement: function() {
      let childrens = this.actor.get_children();
      if(childrens.length > 0) {
         return childrens[0];
      }
      return null;
   },

   getBookmarkById: function(listBookmarks, id) {
      for(let i = 0; i < listBookmarks.length; i++) {
         if(listBookmarks[i].id == id) {
            return listBookmarks[i];
         }
      }
      return null;
   },

   refreshAccessibleItems: function() {
      if(this._staticButtons) {
         for(let i = 0; i < this._staticButtons.length; i++) {
            this._staticButtons[i].actor.destroy();
         }
         this.itemsPlaces.destroy_all_children();
         this.itemsSystem.destroy_all_children();
      }
      this._staticButtons = new Array();
      this.initItemsPlaces();
      this.initItemsSystem();
      this.setIconsVisible(this.iconsVisible);
   },

   initItemsPlaces: function() {
     try {
      let listBookmarks = this.parent._listBookmarks();
      let placesList = this.accessibleMetaData.getPlacesList();
      let currBookmark, item;
      for(let i = 0; i < placesList.length; i++) {
         if(placesList[i] != "") {
            currBookmark = this.getBookmarkById(listBookmarks, placesList[i]);
            item = new PlaceButtonAccessibleExtended(this.parent, this.scrollActor, currBookmark, false, this.iconSize);
            item.actor.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
            item.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
            item.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, item));
            this.itemsPlaces.add_actor(item.actor);
            if(item.menu)
               this.itemsPlaces.add_actor(item.menu.actor);
            else {//Remplace menu actor by a hide false actor.
               falseActor = new St.BoxLayout();
               falseActor.hide();
               this.itemsPlaces.add_actor(falseActor);
            }
            this._staticButtons.push(item);
         }
      }
    } catch(e) {
      Main.notify("Errttt", e.message);
    }
   },

   initItemsSystem: function() {
      let appSys = Cinnamon.AppSystem.get_default();
      let appsList = this.accessibleMetaData.getAppsList();
      for(let i = 0; i < appsList.length; i++) {
         if(appsList[i] != "") {
            this._createApp(appSys, appsList[i]);
         }
      }
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      for(let i = 0; i < this._staticButtons.length; i++) {
         this._staticButtons[i].setIconSize(iconSize);
      }
   },

   _createApp: function(appSys, appName) {
      let iconSizeDrag = 32;
      let app = appSys.lookup_app(appName);
      if(app) {
         let item = new FavoritesButtonExtended(this.parent, this.scrollActor, this.vertical, true, app, 4, this.iconSize, true);
         item.actor.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
         item.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
         item.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, item));
         this.itemsSystem.add_actor(item.actor);
         if(item.menu)
            this.itemsSystem.add_actor(item.menu.actor);
         else {//Remplace menu actor by a hide false actor.
            falseActor = new St.BoxLayout();
            falseActor.hide();
            this.itemsSystem.add_actor(falseActor);
         }
         this._staticButtons.push(item);
      }
   },

   disableSelected: function() {
      if((this._staticSelected != -1)&&(this._staticSelected < this._staticButtons.length)) {
         let selectedBtt = this._staticButtons[this._staticSelected];
         if(!(selectedBtt instanceof FavoritesButtonExtended))
            selectedBtt.actor.style_class = "menu-application-button";
         else
            selectedBtt.actor.remove_style_pseudo_class('active');
      }
      this.selectedAppBox.setSelectedText("", "");
      this.hover.refreshFace();
   },

   activeSelected: function() {
      if((this._staticSelected != -1)&&(this._staticSelected < this._staticButtons.length)) {
         let selectedBtt = this._staticButtons[this._staticSelected];
         if(!(selectedBtt instanceof FavoritesButtonExtended))
            selectedBtt.actor.style_class = "menu-application-button-selected";
         else
            selectedBtt.actor.add_style_pseudo_class('active');
         if(selectedBtt.app.get_description())
            this.selectedAppBox.setSelectedText(selectedBtt.app.get_name(), selectedBtt.app.get_description().split("\n")[0]);
         else
            this.selectedAppBox.setSelectedText(selectedBtt.app.get_name(), "");
         this.hover.refreshApp(selectedBtt.app);
      } else {
         this.selectedAppBox.setSelectedText("", "");
         this.hover.refreshFace();
         this._staticSelected = -1;
      }
   },

   executeButtonAction: function(buttonIndex) {
      if((buttonIndex != -1)&&(buttonIndex < this._staticButtons.length)) {
         this._staticButtons[buttonIndex].actor._delegate.activate();
      }
   },

   navegateStaticBox: function(symbol, actor) {
      if((this._staticSelected != -1)&&(this._staticSelected < this._staticButtons.length)) {
         let changerPos = this._staticSelected;
         this.disableSelected();
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            if(changerPos - 1 < 0)
               this._staticSelected = this._staticButtons.length - 1;
            else
               this._staticSelected = changerPos - 1;
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            if(changerPos + 1 < this._staticButtons.length)
               this._staticSelected = changerPos + 1;
            else
               this._staticSelected = 0;
         } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            this.executeButtonAction(changerPos);
         }

      } else if(this._staticButtons.length > 0) {
         this._staticSelected = 0;
      }
      this.scrollActor.scrollToActor(this._staticButtons[this._staticSelected].actor);
      this.activeSelected();
      return true;
   },

   _appEnterEvent: function(actor, event, applicationButton) {
      this.disableSelected();
      this._staticSelected = this._staticButtons.indexOf(applicationButton);
      this.activeSelected();
   },

   _appLeaveEvent: function(actor, event, applicationButton) {
      this.disableSelected();
   }
};

function SeparatorBox(haveLine, space) {
   this._init(haveLine, space);
}

SeparatorBox.prototype = {
   _init: function(haveLine, space) {
      this.actor = new St.BoxLayout({ vertical: true });
      this.separatorLine = new PopupMenu.PopupSeparatorMenuItem();
      this.actor.add_actor(this.separatorLine.actor);
      this.setLineVisible(haveLine);
      this.setSpace(space);
   },

   setSpace: function(space) {
      this.space = space;
      if(this.actor.get_vertical()) {
         this.actor.set_width(-1);
         this.actor.set_height(space);
      } else {
         this.actor.set_width(space);
         this.actor.set_height(-1);
      }
   },

   setLineVisible: function(show) {
      this.haveLine = show;
      this.separatorLine.actor.visible = show;
   }
};

function SelectedAppBox(parent, activeDateTime) {
   this._init(parent, activeDateTime);
}

SelectedAppBox.prototype = {
   _init: function(parent, activeDateTime) {
      this.dateFormat = "%A,%e %B";
      this.timeFormat = "%H:%M";
      this.appDescriptionSize = 6;
      this.appTitleSize = 15;
      this.timeout = 0;
      this.actor = new St.BoxLayout({ style_class: 'menu-selected-app-box', vertical: true });
      this.appTitle = new St.Label({ style_class: 'menu-selected-app-title', text: "" });
      this.appDescription = new St.Label({ style_class: 'menu-selected-app-description', text: "" });
      this.actor.add_actor(this.appTitle);
      this.actor.add_actor(this.appDescription);
     // this.setAlign(St.Align.START);
      this.setDateTimeVisible(activeDateTime);
   },

   setAlign: function(align) {
      this.actor.remove_actor(this.appTitle);
      this.actor.remove_actor(this.appDescription);
      this.actor.add(this.appTitle, {x_fill: false, x_align: align});
      this.actor.add(this.appDescription, {x_fill: false, x_align: align});
   },

   setTitleVisible: function(show) {
      this.appTitle.visible = show;
   },

   setDescriptionVisible: function(show) {
      this.appDescription.visible = show;
   },

   setTitleSize: function(size) {
      this.appTitleSize = size;
      this.appTitle.style="font-size: " + this.appTitleSize + "pt";
   },

   setDescriptionSize: function(size) {
      this.appDescriptionSize = size;
      this.appDescription.style="font-size: " + this.appDescriptionSize + "pt";
   },

   setDateFormat: function(format) {
      this.dateFormat = format;
   },

   setTimeFormat: function(format) {
      this.timeFormat = format;
   },

   setDateTimeVisible: function(visible) {
      try {
      this.activeDateTime = visible;
      this.appTitle.set_text("");
      this.appDescription.set_text("");
      if((!this.activeDateTime)&&(this.timeout > 0)) {
         Mainloop.source_remove(this.timeout);
         this.timeout = 0;
      }
      else if((this.activeDateTime)&&(this.timeout == 0)&&(this.appTitle.get_text() == "")&&(this.appDescription.get_text() == "")) {
         this.timeout = 1;
         this._refrech();
      }
      } catch(e) {Main.notify("listo", e.message);}
   },

   setSelectedText: function(title, description) {
      this.appTitle.set_text(title);
      this.appDescription.set_text(description);
      if((this.activeDateTime)&&(this.timeout == 0)&&(title == "")&&(description == "")) {
         this.timeout = 1;
         this._refrech();
      }
      else {
         if(this.timeout > 0) {
            Mainloop.source_remove(this.timeout);
            this.timeout = 0;
         }
      }
   },

   _refrech: function() {
      if(this.timeout > 0) {
         let displayDate = new Date();
         this.appTitle.set_text(displayDate.toLocaleFormat(this.timeFormat));
         this.appDescription.set_text(displayDate.toLocaleFormat(this.dateFormat));
         this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refrech));
      }
   }
};

function ButtonChangerBox(parent, icon, labels, selected, callBackOnSelectedChange) {
    this._init(parent, icon, labels, selected, callBackOnSelectedChange);
}

ButtonChangerBox.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function (parent, icon, labels, selected, callBackOnSelectedChange) {
        PopupMenu.PopupSubMenuMenuItem.prototype._init.call(this, labels[selected]);

        this.visible = true;
        this.actor.set_style_class_name('');
        this.actor.reactive = true;
        this.box = new St.BoxLayout({ style_class: 'menu-category-button', reactive: true, track_hover: true });
        this.parent = parent;
        this.labels = labels;
        this.selected = selected;
        this.callBackOnSelectedChange = callBackOnSelectedChange;
        this.removeActor(this.label);
        this.removeActor(this._triangle);
        this._triangle = new St.Label();
        
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

    setTextVisible: function(visible) {
       this.label.visible = visible;
    },

    setActive: function(active) {
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
       if(event.get_button() == 1) {
          this.activateNext();
          /* if (this.parent.leftPane.get_child() == this.parent.favsBox) this.parent.switchPanes("apps");
           else this.parent.switchPanes("favs");*/
        }
    },

    activateNext: function() {
       if(this.selected >= this.labels.length - 1)
          this.selected = 0;
       else
          this.selected ++;
       this.activateIndex(this.selected);
    },

    getSelected: function() {
       return this.labels[this.selected];
    },

    activateSelected: function(selected) {
       let index = this.labels.indexOf(selected);
       if((index != -1)&&(index != this.selected)) {
          this.activateIndex(index);
       }
    },

    activateIndex: function(index) {
       this.selected = index;
       this.label.set_text(this.labels[this.selected]);
       if(this.callBackOnSelectedChange)
          this.callBackOnSelectedChange(this.labels[this.selected]);
    }
};

function PowerBox(parent, theme, iconSize, hover, selectedAppBox) {
   this._init(parent, theme, iconSize, hover, selectedAppBox);
}

PowerBox.prototype = {
   _init: function(parent, theme, iconSize, hover, selectedAppBox) {
      this.parent = parent;
      this.iconSize = iconSize;
      this.signalKeyPowerID = 0;
      this._session = new GnomeSession.SessionManager();
      this.selectedAppBox = selectedAppBox;
      this.hover = hover;
      this.powerSelected = 0;

      this.actor = new St.BoxLayout({ style_class: 'menu-favorites-box' });
      this.actor.style = "padding-left: "+(10)+"px;padding-right: "+(10)+"px;margin:auto;";
      this._powerButtons = new Array();
      this.actor.connect('key-focus-in', Lang.bind(this, function(actor, event) {        
         if(this._powerButtons.length > 0) {
            if((!this.powerSelected)||(this.powerSelected == -1))
               this.powerSelected = 0;
            if(this.activeBar)
               this.powerSelected = 2;
            this._powerButtons[this.powerSelected].setActive(true);
            if(this.signalKeyPowerID == 0)
               this.signalKeyPowerID = this.actor.connect('key-press-event', Lang.bind(this.parent, this.parent._onMenuKeyPress));
         }
      }));
      this.actor.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         for(let cSys in this._powerButtons)
            this._systemButton[cSys].setActive(false);
         if(this.signalKeyPowerID > 0)
            this.actor.disconnect(this.signalKeyPowerID);
         this.powerSelected = -1;
         this.bttChanger.setActive(false);
      }));
      this.spacerPower = new SeparatorBox(false, 0);
      //Lock screen
      let button = new SystemButton(this.parent, null, "gnome-lockscreen", _("Lock screen"), _("Lock the screen"), this.hover, this.iconSize, false);
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
      button.setAction(Lang.bind(this, this._onLockScreenAction));

      this._powerButtons.push(button);
        
      //Logout button
      button = new SystemButton(this.parent, null, "gnome-logout", _("Logout"), _("Leave the session"), this.hover, this.iconSize, false);        
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
      button.setAction(Lang.bind(this, this._onLogoutAction));

      this._powerButtons.push(button);

      //Shutdown button
      button = new SystemButton(this.parent, null, "gnome-shutdown", _("Quit"), _("Shutdown the computer"), this.hover, this.iconSize, false);        
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent)); 
      button.setAction(Lang.bind(this, this._onShutdownAction));

      this._powerButtons.push(button);
      this.setTheme(theme);
   },

   setSeparatorSpace: function(space) {
      this.spacerPower.setSpace(space);
   },

   setSeparatorLine: function(haveLine) {
      this.spacerPower.setLineVisible(haveLine);
   },

   setTheme: function(theme) {
      this.theme = theme;
      this._removeButtons();
      switch(theme) {
         case "vertical":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(false);
            this._setIconsVisible(true);
            break;
         case "vertical-list":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "vertical-icon":
            this.actor.set_vertical(true);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "vertical-text":
            this.actor.set_vertical(true);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(false);
            break;
         case "horizontal":
            this.actor.set_vertical(false);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(false);
            this._setIconsVisible(true);
            break;
         case "horizontal-list":
            this.actor.set_vertical(false);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "horizontal-icon":
            this.actor.set_vertical(false);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "horizontal-text":
            this.actor.set_vertical(false);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(false);

            break;
         case "retractable":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertRetractableButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "retractable-text":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertRetractableButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(false);
            break;
      }
   },

   setSpecialColor: function(specialColor) {
      if(specialColor)
         this.actor.set_style_class_name('menu-favorites-box');
      else
         this.actor.set_style_class_name('');
   },

   _removeButtons: function() {
      let parentBtt = this.spacerPower.actor.get_parent();
      if(parentBtt)
         parentBtt.remove_actor(this.spacerPower.actor);
      for(let i = 0; i < this._powerButtons.length; i++) {
         parentBtt = this._powerButtons[i].actor.get_parent();
         if(parentBtt)
            parentBtt.remove_actor(this._powerButtons[i].actor);
      }
      this.actor.set_height(-1);
      this.actor.destroy_all_children();
      this.activeBar = null;
      this.spacer = null;
   },

   _insertNormalButtons: function(aling) {
      this.actor.add_actor(this.spacerPower.actor);
      for(let i = 0; i < this._powerButtons.length; i++) {
         if((this.theme == "horizontal")||(this.theme == "vertical")||(this.theme == "vertical-icon"))
            this.actor.add(this._powerButtons[i].actor, { x_fill: false, x_align: aling, expand: true });
         else
            this.actor.add(this._powerButtons[i].actor, { x_fill: true, x_align: aling, expand: true });
      }
   },

  _insertRetractableButtons: function(aling) {
      this.actor.add_actor(this.spacerPower.actor);
      this.activeBar = new St.BoxLayout({ vertical: false });
      this.spacer = new St.BoxLayout({ vertical: true });
      this.spacer.style = "padding-left: "+(this.iconSize)+"px;margin:auto;";
      this.bttChanger = new ButtonChangerBox(this, "forward", ["Show Down", "Options"], 0, Lang.bind(this, this._onPowerChange));
      this.bttChanger.setTextVisible(false);
      this.activeBar.add(this._powerButtons[2].actor, { x_fill: true, x_align: aling });
      this.activeBar.add(this.bttChanger.actor, { x_fill: false, x_align: aling });
      this.actor.add(this.activeBar, { x_fill: false, y_fill: false, x_align: aling, y_align: aling, expand: true });
      this.spacer.add(this._powerButtons[0].actor, { x_fill: true, x_align: aling, y_align: aling });
      this.spacer.add(this._powerButtons[1].actor, { x_fill: true, x_align: aling, y_align: aling });
      this.actor.add(this.spacer, { x_fill: false, x_align: aling, y_align: aling, expand: true });
      this._powerButtons[0].actor.visible = false;
      this._powerButtons[1].actor.visible = false;
      Mainloop.idle_add(Lang.bind(this, function() {
         this._adjustSize(this._powerButtons[0].actor);
         this._adjustSize(this._powerButtons[1].actor);
         this._adjustSize(this._powerButtons[2].actor);

      }));
   },

   _adjustSize: function(actor) {
      if(actor.get_width() + this.iconSize + 10 > this.activeBar.get_width()) {
         this.activeBar.set_width(actor.get_width() + this.iconSize + 10);
      }
      if(actor.get_height()*3 + 10 > this.actor.get_height()) {
         this.actor.set_height(actor.get_height()*3 + 10);
      }
   },

  _onPowerChange: function(actor, event) {
     this._powerButtons[0].actor.visible = !this._powerButtons[0].actor.visible;
     this._powerButtons[1].actor.visible = !this._powerButtons[1].actor.visible;
     if(this.powerSelected != -1) {
        this._powerButtons[this.powerSelected].setActive(false);
        this.powerSelected = -1;
        this.bttChanger.setActive(true);
     }
  },

  _setIconsVisible: function(visibleIcon) {
      for(let i = 0; i < this._powerButtons.length; i++) {
         this._powerButtons[i].setIconVisible(visibleIcon);
      }
   },

  _setTextVisible: function(visibleText) {
      for(let i = 0; i < this._powerButtons.length; i++) {
         this._powerButtons[i].setTextVisible(visibleText);
      }
   },

  _setVerticalButtons: function(vertical) {
      for(let i = 0; i < this._powerButtons.length; i++) {
         this._powerButtons[i].setVertical(vertical);
      }
   },

   indexOf: function(actor) {
      for(sysB in this._powerButtons)
         if(this._powerButtons[sysB].actor == actor)
            return sysB;
      return -1;
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      this.actor.set_height(-1);
      if(this._powerButtons) {
         for(let i = 0; i < this._powerButtons.length; i++)
            this._powerButtons[i].setIconSize(this.iconSize);
      } 
      if(this.activeBar) {
         this.spacer.style = "padding-left: "+(this.iconSize)+"px;margin:auto;";
         Mainloop.idle_add(Lang.bind(this, function() {
            this._adjustSize(this._powerButtons[0].actor);
            this._adjustSize(this._powerButtons[1].actor);
            this._adjustSize(this._powerButtons[2].actor);
         }));
      }
   },

   _onLockScreenAction: function() {
      this.parent.menu.close();
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
      this.parent.menu.close();
      this._session.LogoutRemote(0);
   },

   _onShutdownAction: function() {
      this.parent.menu.close();
      this._session.ShutdownRemote();
   },

   _onEnterEvent: function(actor, event) {
      this.parent.applicationsScrollBox.setAutoScrolling(false);
      this.parent.categoriesScrollBox.setAutoScrolling(false);
      //this.parent.favoritesScrollBox.setAutoScrolling(false);
      this.parent.applicationsScrollBox.setAutoScrolling(this.parent.autoscroll_enabled);
      this.parent.categoriesScrollBox.setAutoScrolling(this.parent.autoscroll_enabled);
      //this.parent.favoritesScrollBox.setAutoScrolling(this.autoscroll_enabled);
      let index = this.indexOf(actor);
      this.selectedAppBox.setSelectedText(this._powerButtons[index].title, this._powerButtons[index].description);
      this.hover.refresh(this._powerButtons[index].icon);
   },

   _onLeaveEvent: function(actor, event) {
      this.selectedAppBox.setSelectedText("", "");
      this.hover.refreshFace();
   },

   disableSelected: function() {
      if(this.powerSelected != -1) {
         this._powerButtons[this.powerSelected].setActive(false);
         this.powerSelected = -1;
      }
      if(this.activeBar)
         this.bttChanger.activateSelected("Show Down");
   },

   navegatePowerBox: function(symbol, actor) {
      if(this.activeBar) {
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            if(this.powerSelected == -1) {
               this.bttChanger.setActive(false);
               this.powerSelected = 2;
               this._powerButtons[this.powerSelected].setActive(true);
            } else if(this.powerSelected == 0) {
               this._powerButtons[this.powerSelected].setActive(false);
               this.powerSelected = -1;
               this.bttChanger.setActive(true);
            } else {
               this._powerButtons[this.powerSelected].setActive(false);
               if(this._powerButtons[this.powerSelected - 1].actor.visible) {
                  this.powerSelected--;
                  this._powerButtons[this.powerSelected].setActive(true);
               } else {
                  this.powerSelected = -1;
                  this.bttChanger.setActive(true);
               }
            }
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            if(this.powerSelected == -1) {
               this.bttChanger.setActive(false);
               if(this._powerButtons[0].actor.visible)
                  this.powerSelected = 0;
               else
                  this.powerSelected = 2;
               this._powerButtons[this.powerSelected].setActive(true);
            } else if(this.powerSelected == 2) {
               this._powerButtons[this.powerSelected].setActive(false);
               this.powerSelected = -1;
               this.bttChanger.setActive(true);
            } else {
               this._powerButtons[this.powerSelected].setActive(false);
               this.powerSelected++;
               this._powerButtons[this.powerSelected].setActive(true);
            }
         }
         else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            if(this.powerSelected != -1) {
               this._powerButtons[this.powerSelected].setActive(false);
               this._powerButtons[this.powerSelected].executeAction();
            } else {
               this.bttChanger.activateNext();
            }
         }
      } else {
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            this._powerButtons[this.powerSelected].setActive(false);
            if(this.powerSelected - 1 < 0)
               this.powerSelected = this._powerButtons.length -1;
            else
               this.powerSelected--;
            this._powerButtons[this.powerSelected].setActive(true);
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            this._powerButtons[this.powerSelected].setActive(false);
            if(this.powerSelected + 1 < this._powerButtons.length)
               this.powerSelected++;
            else
               this.powerSelected = 0;
            this._powerButtons[this.powerSelected].setActive(true);
         }
         else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            this._powerButtons[this.powerSelected].setActive(false);
            this._powerButtons[this.powerSelected].executeAction();
         }
      }
      return true;
   }
};

function ControlBox(parent, iconSize) {
   this._init(parent, iconSize);
}

ControlBox.prototype = {
   _init: function(parent, iconSize) {
      this.parent = parent;
      this.iconSize = iconSize;
      this.actor = new St.BoxLayout({ vertical: false });
      this.bttViewList = this._createSymbolicButton('view-list-symbolic', { x_fill: false, expand: false });
      this.bttViewList.connect('clicked', Lang.bind(this, this._onClickedChangeView));
      //this.actor.add(this.bttViewList, { x_fill: false, expand: false });
      this.bttViewGrid = this._createSymbolicButton('view-grid-symbolic', { x_fill: false, expand: false });
      this.bttViewGrid.connect('clicked', Lang.bind(this, this._onClickedChangeView));
      
      this.bttFullScreen = this._createSymbolicButton('zoom-fit-best', {x_fill: false, x_align: St.Align.END, expand: true});
      this.bttFullScreen.connect('clicked', Lang.bind(this, this._onClickedChangeFullScreen));
      this.bttResize = this._createSymbolicButton('changes-prevent', {x_fill: false, x_align: St.Align.END, expand: false});
      this.bttResize.connect('clicked', Lang.bind(this, this._onClickedChangeResize));
      this.bttSettings = this._createSymbolicButton('preferences-system', {x_fill: false, x_align: St.Align.END, expand: false});
      this.bttSettings.connect('clicked', Lang.bind(this, this._onSettings));
      this.changeViewSelected(this.parent.iconView);
      this.changeResizeActive(this.parent.controlingSize);
   },

   _onClickedChangeView: function(actor, event) {
      this.changeViewSelected(!this.parent.iconView);
      this.parent._changeView();
   },

   _onClickedChangeResize: function(actor, event) {
      this.parent.fullScreen = false;
      this.parent.automaticSize = false;
      this.parent._setFullScreen();
      this.changeResizeActive(!this.parent.controlingSize);
      this.parent._updateSize();
   },

   _onClickedChangeFullScreen: function(actor, event) {
      this.parent.fullScreen = !this.parent.fullScreen;
      this.parent._setFullScreen();
      this.changeFullScreen(this.parent.fullScreen);
   },

   _onSettings: function(actor, event) {
      //this._effectIcon(actor, 0.2);
      this.parent.menu.close();
      Util.spawn(['cinnamon-settings', 'applets', this.parent.uuid]);
   },

   changeResizeActive: function(resizeActive) {
      this.parent.controlingSize = resizeActive;
      if(resizeActive) {
         this.bttResize.get_children()[0].set_icon_name('changes-prevent');
         this.parent.menu.setResizeArea(this.parent.deltaMinResize);
      }
      else {
         this.bttResize.get_children()[0].set_icon_name('view-fullscreen');

         this.parent.menu.setResizeArea(0);
      }
   },

   changeViewSelected: function(iconView) {
      this.parent.iconView = iconView;
      if(iconView) {
         this.bttViewList.set_style('padding: 0px;');
         this.bttViewGrid.set_style('padding: 0px; border: 1px solid #ffffff;');
      }
      else {
         this.bttViewList.set_style('padding: 0px; border: 1px solid #ffffff;');
         this.bttViewGrid.set_style('padding: 0px;');
      }
   },

   changeFullScreen: function(fullScreen) {
      if(fullScreen) {
         this.bttFullScreen.get_children()[0].set_icon_name('window-minimize');
      }
      else {
         this.bttFullScreen.get_children()[0].set_icon_name('zoom-fit-best');
         //this.bttFullScreen.get_children()[0].set_icon_name('window-maximize');
      }
   },

   setIconSize: function(iconSize) {
      let childBtt = this.actor.get_children();
      for(let i = 0; i < childBtt.length; i++) {
         childBtt[i].get_children()[0].set_icon_size(iconSize);
      }
   },

   _createSymbolicButton: function(icon, properties) {
      let bttIcon = new St.Icon({icon_name: icon, icon_type: St.IconType.SYMBOLIC,
	                         style_class: 'popup-menu-icon', icon_size: this.iconSize});
      let btt = new St.Button({ child: bttIcon });
      this.actor.add(btt, properties);
   
      btt.connect('notify::hover', Lang.bind(this, function(actor) {
         if(actor.get_hover()) {
            switch(actor) {
               case this.bttViewList:
                  this.parent.selectedAppBox.setSelectedText(_("List View"), _("View the items in list view mode"));
                  break;
               case this.bttViewGrid:
                  this.parent.selectedAppBox.setSelectedText(_("Icon View"), _("View the items in icon view mode"));
                  break;
               case this.bttResize:
                  if(this.bttResize.get_children()[0].get_icon_name() == 'changes-prevent')
                     this.parent.selectedAppBox.setSelectedText(_("Prevent resize"), _("Prevent resize the menu"));
                  else
                     this.parent.selectedAppBox.setSelectedText(_("Allow resize"), _("Allow resize the menu"));
                  break;
               case this.bttFullScreen:
                  if(this.bttFullScreen.get_children()[0].get_icon_name() == 'window-minimize')
                     this.parent.selectedAppBox.setSelectedText(_("Recover size"), _("Recover the normal menu size"));
                  else
                     this.parent.selectedAppBox.setSelectedText(_("Full Screen"), _("Put the menu in full screen mode"));
                  break;
               case this.bttSettings:
                  this.parent.selectedAppBox.setSelectedText(_("Configure..."), _("Configure the menu options"));
                  break;
            }
            global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
            actor.set_style_class_name('menu-category-button-selected');
         }
         else {
            this.parent.selectedAppBox.setSelectedText("", "");
            global.unset_cursor();
            actor.set_style_class_name('menu-category-button');
         }
      }));
      btt.set_style_class_name('menu-category-button');
      btt.set_style('padding: 0px;');
      return btt;
   },

   navegateControlBox: function(symbol, actor) {
   },
/*
   _effectIcon: function(effectIcon, time) {
      Tweener.addTween(effectIcon,
      {  opacity: 0,
         time: time,
         transition: 'easeInSine',
         onComplete: Lang.bind(this, function() {
            Tweener.addTween(effectIcon,
            {  opacity: 255,
               time: time,
               transition: 'easeInSine'
            });
         })
      });
   }*/
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
            this._appButton.parent._updateSize();
            break;
         case "remove_from_favorites":
            AppFavorites.getAppFavorites().removeFavorite(this._appButton.app.get_id());
            break;
         case "add_to_accessible_bar":
           try {
            if(this._appButton.app.isPlace) {
               if(!this._appButton.parent.accessibleMetaData.isInPlacesList(this._appButton.app.get_id())) {
                  let placesList = this._appButton.parent.accessibleMetaData.getPlacesList();
                  placesList.push(this._appButton.app.get_id());
                  this._appButton.parent.accessibleMetaData.setPlacesList(placesList);
               }
            } else {
               if(!this._appButton.parent.accessibleMetaData.isInAppsList(this._appButton.app.get_id())) {
                  let appsList = this._appButton.parent.accessibleMetaData.getAppsList();
                  appsList.push(this._appButton.app.get_id());
                  this._appButton.parent.accessibleMetaData.setAppsList(appsList);
               }
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
         case "remove_from_accessible_bar":
            try {
            if(this._appButton.app.isPlace) {
               if(this._appButton.parent.accessibleMetaData.isInPlacesList(this._appButton.app.get_id())) {
                  let placesList = this._appButton.parent.accessibleMetaData.getPlacesList();
                  placesList.splice(placesList.indexOf(this._appButton.app.get_id()), 1);
                  this._appButton.parent.accessibleMetaData.setPlacesList(placesList);
               }
            } else {
               if(this._appButton.parent.accessibleMetaData.isInAppsList(this._appButton.app.get_id())) {
                  let appsList = this._appButton.parent.accessibleMetaData.getAppsList();
                  appsList.splice(appsList.indexOf(this._appButton.app.get_id()), 1);
                  this._appButton.parent.accessibleMetaData.setAppsList(appsList);
               }
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
      }
      this._appButton.toggleMenu();
      return false;
   }
};

function GenericApplicationButtonExtended(parent, parentScroll, app, withMenu) {
   this._init(parent, parentScroll, app, withMenu);
}

GenericApplicationButtonExtended.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent, parentScroll, app, withMenu) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.app = app;
      this.parent = parent;
      this.parentScroll = parentScroll;
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
         if((this.withMenu) && (!this.menu.isOpen)) {
            this.parent.closeApplicationsContextMenus(this.app, true);
         }
         this.toggleMenu();
      }
      return true;
   },
    
   activate: function(event) {
      this.app.open_new_window(-1);
      this.parent.menu.close();
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
         if(!this.app.isPlace) {
            menuItem = new ApplicationContextMenuItemExtended(this, _("Add to panel"), "add_to_panel");
            this.menu.addMenuItem(menuItem);
            if(USER_DESKTOP_PATH) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to desktop"), "add_to_desktop");
               this.menu.addMenuItem(menuItem);
            }
            if(AppFavorites.getAppFavorites().isFavorite(this.app.get_id())) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from favorites"), "remove_from_favorites");
               this.menu.addMenuItem(menuItem);
            } else {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to favorites"), "add_to_favorites");
               this.menu.addMenuItem(menuItem);
            }
            if(this.parent.accessibleMetaData.isInAppsList(this.app.get_id())) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from accessible bar"), "remove_from_accessible_bar");
               this.menu.addMenuItem(menuItem);
            } else {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to accessible bar"), "add_to_accessible_bar");
               this.menu.addMenuItem(menuItem);
            }
         } else {
            if(this.parent.accessibleMetaData.isInPlacesList(this.app.get_id())) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from accessible bar"), "remove_from_accessible_bar");
               this.menu.addMenuItem(menuItem);
            } else {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to accessible bar"), "add_to_accessible_bar");
               this.menu.addMenuItem(menuItem);
            }
         }
      }
      this.menu.toggle();
   },
    
   _subMenuOpenStateChanged: function() {
      if(this.menu.isOpen) {
         this.parentScroll.scrollToActor(this.menu.actor);
         this.parent._updateSize();
      }
   },

   _onKeyPressEvent: function(actor, event) {
      let symbol = event.get_key_symbol();
/*
      if(symbol == Clutter.KEY_space) {
         if((this.withMenu) && (!this.menu.isOpen)) {
            this.parent.closeApplicationsContextMenus(this.app, true);
         }
         this.toggleMenu();
         return true;
      }*/
      return PopupBaseMenuItem.prototype._onKeyPressEvent.call(this, actor, event);
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
      /*if(this._numberView == 1) {
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
      else {*/
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
   //   }
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
         this.setBorderSize(0);
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
         Main.notifyError("ErrorHover:",e.message);
      }
   },

   setBorderSize: function(borderSize) {
      this.borderSize = borderSize;
      this.actor.style = "padding-top: "+(0)+"px;padding-bottom: "+(0)+"px;padding-left: "+(0)+"px;padding-right: "+(0)+
                         "px;margin:auto;border: "+ borderSize + "px solid #ffffff; border-radius: 12px;";
   },

   navegateHoverMenu: function(symbol, actor) {
      if((symbol == Clutter.KEY_Down)||(symbol == Clutter.KEY_Up)) {
         if(this.account.active) {
            this.fav_actor = this.notificationsSwitch.actor;
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
         }
         if(this.notificationsSwitch.active) {
            this.fav_actor = this.account.actor;
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
         }
      }
   },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
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
       //if (this.menu.isOpen) this.parent._scrollToButton(this.menu);
       if(!this.menu.isOpen)
          this.parent.searchEntry.set_width(-1);
       else
          this.parent._updateSize();
          //this.menu.actor.can_focus = false;
       /*else
          this.menu.actor.can_focus = true;*/
   },
    
   activate: function(event) {
      //this.parent.menu.close();
      //Main.notify("close");
      //PopupBaseMenuItem.prototype.activate.call(this, event, true);
   },

   closeMenu: function() {
      this.menu.close(true);
   },
    
   toggleMenu: function() {
      if(this.menu.isOpen) {
         this.menu.close(true);
         this.menu.sourceActor._delegate.setActive(true);
      } else {
         if(this.actor.get_parent() == this.parent.searchBox)
            this.parent.searchEntry.set_width(200);
         this.menu.open();
         this.menu.sourceActor._delegate.setActive(true);
      }
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

function AccessibleDropBox(parent, place) {
   this._init(parent, place);
}

AccessibleDropBox.prototype = {
   _init: function(parent, place) {
      this.parent = parent;
      this.place = place;
      this.actor = new St.BoxLayout({ vertical: true });
      this.actor._delegate = this;

      this._dragPlaceholder = null;
      this._dragPlaceholderPos = -1;
      this._animatingPlaceholdersCount = 0;
   },
    
   _clearDragPlaceholder: function() {
      if(this._dragPlaceholder) {
         this._dragPlaceholder.animateOutAndDestroy();
         this._dragPlaceholder = null;
         this._dragPlaceholderPos = -1;
      }
   },
    
   handleDragOver: function(source, actor, x, y, time) {
    try {
      let currentObj, classType1, classType2;
      if(this.place) {
         currentObj = this.parent.accessibleMetaData.getPlacesList();
         classType1 = PlaceButtonAccessibleExtended;
         classType2 = PlaceButtonExtended;
      } else {
         currentObj = this.parent.accessibleMetaData.getAppsList();
         classType1 = FavoritesButtonExtended;
         classType2 = ApplicationButtonExtended;
      }
      let app = source.app;
      let itemPos = currentObj.indexOf(app.get_id());
      // Don't allow favoriting of transient apps
      if(app == null || app.is_window_backed() || ((!(source instanceof classType1)) && (!(source instanceof classType2))))
         return DND.DragMotionResult.NO_DROP;

      let numItems = currentObj.length;

      let children = this.actor.get_children();
      let numChildren = children.length/2;
      let boxHeight = this.actor.height;

      // Keep the placeholder out of the index calculation; assuming that
      // the remove target has the same size as "normal" items, we don't
      // need to do the same adjustment there.
      if(this._dragPlaceholder) {
         boxHeight -= this._dragPlaceholder.actor.height;
         numChildren--;
      }

      let pos = Math.round(y * numItems / boxHeight);

      if(pos != this._dragPlaceholderPos && pos <= numItems) {
         if(this._animatingPlaceholdersCount > 0) {
            let appChildren = children.filter(function(actor) {
               return ((actor._delegate instanceof classType1) || (actor._delegate instanceof classType2));
            });
            this._dragPlaceholderPos = children.indexOf(appChildren[pos]);
         } else {
            this._dragPlaceholderPos = pos;
         }

         // Don't allow positioning before or after self
         if(itemPos != -1 && (pos == itemPos || pos == itemPos + 1)) {
            if(this._dragPlaceholder) {
               this._dragPlaceholder.animateOutAndDestroy();
               this._animatingPlaceholdersCount++;
               this._dragPlaceholder.actor.connect('destroy',
                  Lang.bind(this, function() {
                     this._animatingPlaceholdersCount--;
                  }));
            }
            this._dragPlaceholder = null;

            return DND.DragMotionResult.CONTINUE;
         }

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
         this._dragPlaceholder.child.set_width (source.actor.height);
         this._dragPlaceholder.child.set_height (source.actor.height);
         this.actor.insert_actor(this._dragPlaceholder.actor, this._dragPlaceholderPos);
         if(fadeIn)
            this._dragPlaceholder.animateIn();
      }

      let srcIsCurrentItem = (itemPos != -1);

      if(srcIsCurrentItem)
         return DND.DragMotionResult.MOVE_DROP;

      return DND.DragMotionResult.COPY_DROP;
     } catch(e) {
        Main.notify("Drag and Drop problem:", e.message);
     }
   },
    
   // Draggable target interface
   acceptDrop: function(source, actor, x, y, time) {
      let currentObj, classType1, classType2;
      if(this.place) {
         currentObj = this.parent.accessibleMetaData.getPlacesList();
         classType1 = PlaceButtonAccessibleExtended;
         classType2 = PlaceButtonExtended;
      } else {
         currentObj = this.parent.accessibleMetaData.getAppsList();
         classType1 = FavoritesButtonExtended;
         classType2 = ApplicationButtonExtended;
      }

      let app = source.app;

      // Don't allow favoriting of transient apps
      if(app == null || app.is_window_backed() || ((!(source instanceof classType1)) && (!(source instanceof classType2)))) {
         return false;
      }

      let id = app.get_id();

      let itemPos = currentObj.indexOf(app.get_id());

      let srcIsCurrentItem = (itemPos != -1);

      itemPos = 0;
      let children = this.actor.get_children();
      for(let i = 0; i < this._dragPlaceholderPos; i++) {
         if(this._dragPlaceholder && children[i] == this._dragPlaceholder.actor)
            continue;
            
         if(!(children[i]._delegate instanceof classType1)) continue;

         let childId = children[i]._delegate.app.get_id();
         if(childId == id)
            continue;
         if(currentObj.indexOf(childId) != -1)
            itemPos++;
      }

      Meta.later_add(Meta.LaterType.BEFORE_REDRAW, Lang.bind(this, function () {
         if(srcIsCurrentItem) {//moveFavoriteToPos
            currentObj.splice(currentObj.indexOf(app.get_id()), 1);
            currentObj.splice(itemPos, 0, id);
            if(this.place)
               this.parent.accessibleMetaData.setPlacesList(currentObj);
            else
               this.parent.accessibleMetaData.setAppsList(currentObj);
         }
         else {
            currentObj.splice(itemPos, 0, id);
            if(this.place)
               this.parent.accessibleMetaData.setPlacesList(currentObj);
            else
               this.parent.accessibleMetaData.setAppsList(currentObj);
         }
         return false;
      }));

      return true;
   }
};

function FavoritesBoxExtended(parent, vertical, numberLines) {
   this._init(parent, vertical, numberLines);
}

FavoritesBoxExtended.prototype = {
   _init: function(parent, vertical, numberLines) {
      this.parent = parent;
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

   add: function(actor, menu, properties) {
      let childrens = this.actor.get_children();
      let currentNumberLines = childrens[0].get_children().length;
      if(currentNumberLines == 0) {
         this._addInCorrectBox(childrens[0], actor, menu, properties);
      }
      else {
         for(let i = 1; i < childrens.length; i++) {
            if(currentNumberLines > childrens[i].get_children().length) {
               this._addInCorrectBox(childrens[i], actor, menu, properties);
               currentNumberLines--; 
               break;
            }
         }
         if(currentNumberLines == childrens[0].get_children().length)
            this._addInCorrectBox(childrens[0], actor, menu, properties);
      }
   },

   _addInCorrectBox: function(box, actor, menu, properties) {
      box.add(actor, properties);
      if(menu)
         box.add_actor(menu.actor);
      else {//Remplace menu actor by a hide false actor.
         falseActor = new St.BoxLayout();
         falseActor.hide();
         box.add_actor(falseActor);
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
         this.actor.remove_actor(childrens[i]);
         childrens[i].destroy();
      }
      this.numberLines = 0;
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
      return null;
   },
    
   // Draggable target interface
   acceptDrop: function(source, actor, x, y, time) {
     try {
//this.parent._refreshFavs();
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
      return false;
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
               posX = childrens[posY].get_children().length - 2;
            else
               posX -= 2;
         }
         else if(symbol == Clutter.KEY_Down) {
            if(posX == childrens[posY].get_children().length - 2)
               posX = 0;
            else
               posX += 2;
         }
         else if(symbol == Clutter.KEY_Right) {
            if(posY == childrens.length - 1)
               posY = 0;
            else
               posY += 1;
         }
         else if(symbol == Clutter.KEY_Left) {
            if(posY == 0)
               posY = childrens.length - 1;
            else
               posY -= 1;
         }
      }
      else {
        if(symbol == Clutter.KEY_Up) {
            if(posY == 0)
               posY = childrens.length - 1;
            else
               posY -= 1;
         }
         else if(symbol == Clutter.KEY_Down) {
            if(posY == childrens.length - 1)
               posY = 0;
            else
               posY += 1;
         }
         else if(symbol == Clutter.KEY_Right) {
            if(posX == childrens[posY].get_children().length - 2)
               posX = 0;
            else
               posX += 2;
         }
         else if(symbol == Clutter.KEY_Left) {
            if(posX == 0)
               posX = childrens[posY].get_children().length - 2;
            else
               posX -= 2;
         }
      }
      let nextItem = null;
      if((childrens[posY])&&(childrens[posY].get_children()[posX]))
         nextItem = childrens[posY].get_children()[posX]
      if((!nextItem)&&(childrens[0])&&(childrens[0].get_children()[0]))
         nextItem = childrens[0].get_children()[0];
      if(nextItem)
         global.stage.set_key_focus(nextItem);
      return nextItem;
   }
};

function TransientButtonExtended(parent, pathOrCommand, iconSize) {
   this._init(parent, pathOrCommand, iconSize);
}

TransientButtonExtended.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent, pathOrCommand, iconSize) {
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

      this.parent = parent;
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

   _onButtonReleaseEvent: function(actor, event) {
      if(event.get_button() == 1) {
         this.activate(event);
      }
      return true;
   },
    
   activate: function(event) {
      if(this.handler != null) {
         this.handler.launch([this.file], null);
      } else {
         // Try anyway, even though we probably shouldn't.
         try {
            Util.spawn(['gvfs-open', this.file.get_uri()]);
         } catch(e) {
            global.logError("No handler available to open " + this.file.get_uri());
         }   
      }
      this.parent.menu.close();
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

function SystemButton(parent, parentScroll, icon, title, description, hoverIcon, iconSize, haveText) {
   this._init(parent, parentScroll, icon, title, description, hoverIcon, iconSize, haveText);
}

SystemButton.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,

   _init: function(parent, parentScroll, icon, title, description, hoverIcon, iconSize, haveText) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll);
      this.actor.set_style_class_name('menu-favorites-button');
      this.actor.style = "padding-top: "+(4)+"px;padding-bottom: "+(4)+"px;padding-left: "+(4)+"px;padding-right: "+(4)+"px;margin:auto;";
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

      this.label = new St.Label({ text: this.title , style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.textBox = new St.BoxLayout({ vertical: false });
      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.setTextVisible(false);
      this.setIconVisible(true);
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

      this.addActor(this.container);
      this.label.realize();
      this.iconObj.realize();
   },

   setIconVisible: function(haveIcon) {
      this.iconObj.visible = haveIcon;
   },

   setTextVisible: function(haveText) {
      this.textBox.visible = haveText;
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
   },

   setIconSize: function(iconSize) {
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
      if((this.actionCallBack)&&((!event)||(event.get_button()==1))) {
         this.setActive(false);
         this.actionCallBack();
      }
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

function ApplicationButtonExtended(parent, parentScroll, app, vertical, iconSize, iconSizeDrag) {
   this._init(parent, parentScroll, app, vertical, iconSize, iconSizeDrag);
}

ApplicationButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(parent, parentScroll, app, vertical, iconSize, iconSizeDrag) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, app, true);
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
      this.icon.realize();
      this.label.realize();

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));
      this.isDraggableApp = true;
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
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();
      return false;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         let visible = this.icon.visible;
         this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.app.create_icon_texture(this.iconSize);
         this.icon.visible = visible;
         this.container.insert_actor(this.icon, 0);
      }
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

function PlaceButtonAccessibleExtended(parent, parentScroll, place, vertical, iconSize) {
   this._init(parent, parentScroll, place, vertical, iconSize);
}

PlaceButtonAccessibleExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,

   _init: function(parent, parentScroll, place, vertical, iconSize) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, this._createAppWrapper(place), (parent._listDevices().indexOf(place) == -1));
      this.iconSize = iconSize;
      this.parent = parent;
      this.place = place;

      this.actor.set_style_class_name('menu-application-button');
      this.label = new St.Label({ text: this.place.name, style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: vertical });
      this.setVertical(vertical);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = this.place.iconFactory(this.iconSize);
      if(!this.icon)
         this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      if(this.icon)
         this.container.add_actor(this.icon);
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));
      this.isDraggableApp = true;

   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         let visible = this.icon.visible;
         this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.place.iconFactory(this.iconSize);
         if(!this.icon)
            this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
         if(this.icon)
            this.container.insert_actor(this.icon, 0);
         this.icon.visible = visible;
      }
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
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();
      return false;
   },

   _createAppWrapper: function(place) {
      // We need this fake app to help standar works.
      this.app = {
         isPlace: {
         },
         get_app_info: {
            get_filename: function() {
               return place.name;
            }
         },
         open_new_window: function(open) {
            place.launch();
         },
         is_window_backed: function(open) {
            return false;
         },
         get_id: function() {
            return place.id;
         },
         get_description: function() {
            return place.id.slice(16);
         },
         get_name: function() {
            return  place.name;
         },
         create_icon_texture: function(appIconSize) {
            return place.iconFactory(appIconSize);
         }
      };
      return this.app;
   }
};

function PlaceButtonExtended(parent, parentScroll, place, vertical, iconSize) {
   this._init(parent, parentScroll, place, vertical, iconSize);
}

PlaceButtonExtended.prototype = {
   __proto__: PlaceButtonAccessibleExtended.prototype,

   _init: function(parent, parentScroll, place, vertical, iconSize) {
      PlaceButtonAccessibleExtended.prototype._init.call(this, parent, parentScroll, place, vertical, iconSize);
      this.actor._delegate = this;
   },

   get_app_id: function() {
      return this.app.get_id();
   },
    
   getDragActor: function() {
      let icon_size = this.iconSize;
     // if(this.iconSizeDrag < this.iconSize)
     //    icon_size = this.iconSizeDrag;
      return this.app.create_icon_texture(icon_size);
    },

    // Returns the original actor that should align with the actor
    // we show as the item is being dragged.
    getDragActorSource: function() {
       return this.actor;
    }
};

function RecentButtonExtended(parent, file, vertical, iconSize) {
   this._init(parent, file, vertical, iconSize);
}

RecentButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(parent, file, vertical, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.file = file;
      this.parent = parent;
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

   _onButtonReleaseEvent: function(actor, event) {
      if(event.get_button() == 1) {
         Gio.app_info_launch_default_for_uri(this.file.uri, global.create_app_launch_context());
         this.parent.menu.close();
      }
   },

   activate: function(event) {
      Gio.app_info_launch_default_for_uri(this.file.uri, global.create_app_launch_context());
      this.parent.menu.close();
   },

   setIconSize: function(iconSize) {
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

function RecentClearButtonExtended(parent, vertical, iconSize) {
   this._init(parent, vertical, iconSize);
}

RecentClearButtonExtended.prototype = {
   __proto__: CinnamonMenu.RecentClearButton.prototype,

   _init: function(parent, vertical, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.parent = parent;
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

   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button() == 1) {
         this.parent.menu.close();
         let GtkRecent = new Gtk.RecentManager();
         GtkRecent.purge_items();
      }
   },

   activate: function(event) {
      this.parent.menu.close();
      let GtkRecent = new Gtk.RecentManager();
      GtkRecent.purge_items();
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

function FavoritesButtonExtended(parent, parentScroll, vertical, displayVertical, app, nbFavorites, iconSize, allowName) {
   this._init(parent, parentScroll, vertical, displayVertical, app, nbFavorites, iconSize, allowName);
}

FavoritesButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(parent, parentScroll, vertical, displayVertical, app, nbFavorites, iconSize, allowName) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, app, true);
      this.iconSize = iconSize;
      this.displayVertical = displayVertical;
      this.vertical = vertical;
      this.allowName = allowName;
      this.nbFavorites = nbFavorites;

      let icon_size = this.iconSize;
      if(!this.allowName) {
         let monitor = Main.layoutManager.findMonitorForActor(this.actor);
         let monitorHeight;
         if(this.displayVertical)
            monitorHeight = monitor.height;
         else
            monitorHeight = monitor.width;
         let real_size = (0.7*monitorHeight) / this.nbFavorites;
         icon_size = 0.7*real_size;
         if(icon_size > this.iconSize) icon_size = this.iconSize;
      }
      this.actor.add_style_class_name('menu-favorites-button');
      this.actor.style = "padding-top: "+5+"px;padding-bottom: "+5+"px;padding-left: "+4+"px;padding-right: "+4+"px;margin:auto;";

      this.container = new St.BoxLayout();
      this.icon = app.create_icon_texture(icon_size);
      this.container.add_actor(this.icon);

      if(this.allowName) {
         this.label = new St.Label({ text: this.app.get_name(), style_class: 'menu-application-button-label' });
         this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
         this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
         this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);

         this.textBox = new St.BoxLayout({ vertical: false });
         this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.setVertical(vertical);
      }

      this.addActor(this.container);
      this.icon.realize()

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));  
      this.isDraggableApp = true;
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         if(!this.allowName) {
            let monitor = Main.layoutManager.findMonitorForActor(this.actor);
            let monitorHeight;
            if(this.displayVertical)
               monitorHeight = monitor.height;
            else
               monitorHeight = monitor.width;
            let real_size = (0.7*monitorHeight) / this.nbFavorites;
            let icon_size = 0.7*real_size;
            if(icon_size > this.iconSize) icon_size = this.iconSize;
         }
         let visible = this.icon.visible;
         this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.app.create_icon_texture(this.iconSize);
         if(this.icon) {
            this.container.insert_actor(this.icon, 0);
            this.icon.visible = visible;
         }
      }
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

   _onDragEnd: function(actor, time, acepted) {
      //try {
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
     /* } catch(e) {
           Main.notify("err", e.message);
      }*/
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();
      return false;
   }
};

function CategoryButtonExtended(app, iconSize, iconVisible) {
   this._init(app, iconSize, iconVisible);
}

CategoryButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(category, iconSize, iconVisible) {
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
      this.setIconVisible(iconVisible);
   },

   setIconVisible: function (visible) {
      if(this.icon)
         this.icon.visible = visible;
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

function PlaceCategoryButtonExtended(app, iconSize, iconVisible) {
    this._init(app, iconSize, iconVisible);
}

PlaceCategoryButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(category, iconSize, iconVisible) {
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
      this.setIconVisible(iconVisible);
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
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

function RecentCategoryButtonExtended(app, iconSize, iconVisible) {
   this._init(app, iconSize, iconVisible);
}

RecentCategoryButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(category, iconSize, iconVisible) {
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
      this.setIconVisible(iconVisible);
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
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

function ConfigurablePointer(arrowSide, binProperties) {
   this._init(arrowSide, binProperties);
}

ConfigurablePointer.prototype = {
   __proto__: BoxPointer.BoxPointer.prototype,

   _init: function(arrowSide, binProperties) {
      BoxPointer.BoxPointer.prototype._init.call (this, arrowSide, binProperties);
      this.riseArrow = true;
      this.fixCorner = false;
      this.resizeSize = 0;
      let [res, selectedColor] = Clutter.Color.from_string("#505050");
      this.selectedColor = selectedColor;
   },

   setArrow: function(arrow) {
      this.riseArrow = arrow;
      this._border.queue_repaint();
   },

   fixToCorner: function(fixCorner) {
      this.fixCorner = fixCorner;
      this._border.queue_repaint();
   },

   setResizeArea: function(resizeSize) {
      this.resizeSize = resizeSize;
      this._border.queue_repaint();
   },

   setResizeAreaColor: function(resizeColor) {
      let [res, selectedColor] = Clutter.Color.from_string(resizeColor);
      this.selectedColor = selectedColor;
      this._border.queue_repaint();
   },

   _reposition: function(sourceActor, alignment) {
        // Position correctly relative to the sourceActor
        let sourceNode = sourceActor.get_theme_node();
        let sourceContentBox = sourceNode.get_content_box(sourceActor.get_allocation_box());
        let sourceAllocation = Cinnamon.util_get_transformed_allocation(sourceActor);
        let sourceCenterX = sourceAllocation.x1 + sourceContentBox.x1 + (sourceContentBox.x2 - sourceContentBox.x1) * this._sourceAlignment;
        let sourceCenterY = sourceAllocation.y1 + sourceContentBox.y1 + (sourceContentBox.y2 - sourceContentBox.y1) * this._sourceAlignment;
        let [minWidth, minHeight, natWidth, natHeight] = this.actor.get_preferred_size();

        // We also want to keep it onscreen, and separated from the
        // edge by the same distance as the main part of the box is
        // separated from its sourceActor
        let monitor = Main.layoutManager.findMonitorForActor(sourceActor);
        let themeNode = this.actor.get_theme_node();
        let borderWidth = themeNode.get_length('-arrow-border-width');
        let arrowBase = themeNode.get_length('-arrow-base');
        let borderRadius = themeNode.get_length('-arrow-border-radius');
        let margin = (4 * borderRadius + borderWidth + arrowBase);
        let halfMargin = margin / 2;

        let themeNode = this.actor.get_theme_node();
        let gap = themeNode.get_length('-boxpointer-gap');

        let resX, resY;

        switch (this._arrowSide) {
        case St.Side.TOP:
            resY = sourceAllocation.y2 + gap;
            break;
        case St.Side.BOTTOM:
            resY = sourceAllocation.y1 - natHeight - gap;
            break;
        case St.Side.LEFT:
            resX = sourceAllocation.x2 + gap;
            break;
        case St.Side.RIGHT:
            resX = sourceAllocation.x1 - natWidth - gap;
            break;
        }

        // Now align and position the pointing axis, making sure
        // it fits on screen
        switch (this._arrowSide) {
        case St.Side.TOP:
        case St.Side.BOTTOM:
            resX = sourceCenterX - (halfMargin + (natWidth - margin) * alignment);

            resX = Math.max(resX, monitor.x + 10);
            resX = Math.min(resX, monitor.x + monitor.width - (10 + natWidth));
            this.setArrowOrigin(sourceCenterX - resX);
            break;

        case St.Side.LEFT:
        case St.Side.RIGHT:
            resY = sourceCenterY - (halfMargin + (natHeight - margin) * alignment);

            resY = Math.max(resY, monitor.y + 10);
            resY = Math.min(resY, monitor.y + monitor.height - (10 + natHeight));

            this.setArrowOrigin(sourceCenterY - resY);
            break;
        }

        let parent = this.actor.get_parent();
        let success, x, y;
        while (!success) {
            [success, x, y] = parent.transform_stage_point(resX, resY);
            parent = parent.get_parent();
        }
        
        if(this.fixCorner) {
           if(sourceAllocation.x1 < 1) {
              this._xOffset = -x - themeNode.get_length('border-left');
           }
           else if(Math.abs(sourceAllocation.x2 - monitor.x - monitor.width) < 1) {
              this._xOffset = 10 + themeNode.get_length('border-right');
           }
           if(this._arrowSide == St.Side.TOP) {
              this._yOffset = -themeNode.get_length('border-top') - gap;
           } else if(this._arrowSide == St.Side.BOTTOM) {
              this._yOffset = themeNode.get_length('border-bottom') + gap;
           }
          // Main.notify("x:" + x + " x1:" + sourceAllocation.x1 + " x2:" + sourceAllocation.x2 + " main:" + (monitor.x - monitor.width));
         //  Main.notify("y:" + y + " y1:" + sourceAllocation.y1 + " y2:" + sourceAllocation.y2 + " main:" + (monitor.x - monitor.height)); 
        }

        this._xPosition = Math.floor(x);
        this._yPosition = Math.floor(y);
        this._shiftActor();
   },

   _drawBorder: function(area) {
      let themeNode = this.actor.get_theme_node();

      let borderWidth = themeNode.get_length('-arrow-border-width');
      let base = themeNode.get_length('-arrow-base');
      let rise = 0;
      if(this.riseArrow)
         rise = themeNode.get_length('-arrow-rise');

      let borderRadius = themeNode.get_length('-arrow-border-radius');

      let halfBorder = borderWidth / 2;
      let halfBase = Math.floor(base/2);

      let borderColor = themeNode.get_color('-arrow-border-color');
      let backgroundColor = themeNode.get_color('-arrow-background-color');

      let [width, height] = area.get_surface_size();
      let [boxWidth, boxHeight] = [width, height];
      if(this._arrowSide == St.Side.TOP || this._arrowSide == St.Side.BOTTOM) {
         boxHeight -= rise;
      } else {
         boxWidth -= rise;
      }
      let cr = area.get_context();
      Clutter.cairo_set_source_color(cr, borderColor);

      // Translate so that box goes from 0,0 to boxWidth,boxHeight,
      // with the arrow poking out of that
      if(this._arrowSide == St.Side.TOP) {
         cr.translate(0, rise);
      } else if (this._arrowSide == St.Side.LEFT) {
         cr.translate(rise, 0);
      }

      let [x1, y1] = [halfBorder, halfBorder];
      let [x2, y2] = [boxWidth - halfBorder, boxHeight - halfBorder];

      cr.moveTo(x1 + borderRadius, y1);
      if(this._arrowSide == St.Side.TOP) {
         if(this._arrowOrigin < (x1 + (borderRadius + halfBase))) {
            cr.lineTo(this._arrowOrigin, y1 - rise);
            cr.lineTo(Math.max(x1 + borderRadius, this._arrowOrigin) + halfBase, y1);
         } else if(this._arrowOrigin > (x2 - (borderRadius + halfBase))) {
            cr.lineTo(Math.min(x2 - borderRadius, this._arrowOrigin) - halfBase, y1);
            cr.lineTo(this._arrowOrigin, y1 - rise);
         } else {
            cr.lineTo(this._arrowOrigin - halfBase, y1);
            cr.lineTo(this._arrowOrigin, y1 - rise);
            cr.lineTo(this._arrowOrigin + halfBase, y1);
         }
      }

      cr.lineTo(x2 - borderRadius, y1);

      // top-right corner
      cr.arc(x2 - borderRadius, y1 + borderRadius, borderRadius,
             3*Math.PI/2, Math.PI*2);

      if(this._arrowSide == St.Side.RIGHT) {
         if(this._arrowOrigin < (y1 + (borderRadius + halfBase))) {
            cr.lineTo(x2 + rise, this._arrowOrigin);
            cr.lineTo(x2, Math.max(y1 + borderRadius, this._arrowOrigin) + halfBase);
         } else if(this._arrowOrigin > (y2 - (borderRadius + halfBase))) {
            cr.lineTo(x2, Math.min(y2 - borderRadius, this._arrowOrigin) - halfBase);
            cr.lineTo(x2 + rise, this._arrowOrigin);
         } else {
            cr.lineTo(x2, this._arrowOrigin - halfBase);
            cr.lineTo(x2 + rise, this._arrowOrigin);
            cr.lineTo(x2, this._arrowOrigin + halfBase);
         }
      }

      cr.lineTo(x2, y2 - borderRadius);

      // bottom-right corner
      cr.arc(x2 - borderRadius, y2 - borderRadius, borderRadius,
             0, Math.PI/2);

      if(this._arrowSide == St.Side.BOTTOM) {
         if(this._arrowOrigin < (x1 + (borderRadius + halfBase))) {
            cr.lineTo(Math.max(x1 + borderRadius, this._arrowOrigin) + halfBase, y2);
            cr.lineTo(this._arrowOrigin, y2 + rise);
         } else if(this._arrowOrigin > (x2 - (borderRadius + halfBase))) {
            cr.lineTo(this._arrowOrigin, y2 + rise);
            cr.lineTo(Math.min(x2 - borderRadius, this._arrowOrigin) - halfBase, y2);
         } else {
            cr.lineTo(this._arrowOrigin + halfBase, y2);
            cr.lineTo(this._arrowOrigin, y2 + rise);
            cr.lineTo(this._arrowOrigin - halfBase, y2);
         }
      }

      cr.lineTo(x1 + borderRadius, y2);

      // bottom-left corner
      cr.arc(x1 + borderRadius, y2 - borderRadius, borderRadius,
             Math.PI/2, Math.PI);

      if(this._arrowSide == St.Side.LEFT) {
         if(this._arrowOrigin < (y1 + (borderRadius + halfBase))) {
            cr.lineTo(x1, Math.max(y1 + borderRadius, this._arrowOrigin) + halfBase);
            cr.lineTo(x1 - rise, this._arrowOrigin);
         } else if(this._arrowOrigin > (y2 - (borderRadius + halfBase))) {
            cr.lineTo(x1 - rise, this._arrowOrigin);
            cr.lineTo(x1, Math.min(y2 - borderRadius, this._arrowOrigin) - halfBase);
         } else {
            cr.lineTo(x1, this._arrowOrigin + halfBase);
            cr.lineTo(x1 - rise, this._arrowOrigin);
            cr.lineTo(x1, this._arrowOrigin - halfBase);
         }
      }

      cr.lineTo(x1, y1 + borderRadius);

      // top-left corner
      cr.arc(x1 + borderRadius, y1 + borderRadius, borderRadius,
             Math.PI, 3*Math.PI/2);

      Clutter.cairo_set_source_color(cr, backgroundColor);
      cr.fillPreserve();
      Clutter.cairo_set_source_color(cr, borderColor);
      cr.setLineWidth(borderWidth);
      cr.stroke();

      if(this.resizeSize > 0) {
         let maxSpace = Math.max(this.resizeSize, borderRadius);
         let monitor = Main.layoutManager.findMonitorForActor(this._sourceActor);
         let center = (monitor.x + monitor.width)/2;
         let sourceAllocation = Cinnamon.util_get_transformed_allocation(this._sourceActor);

         if(this._arrowSide == St.Side.BOTTOM) {
            if(sourceAllocation.x1 < center) {
               cr.moveTo(x2 - maxSpace - borderWidth, y1 - borderWidth);
               cr.lineTo(x2 + borderWidth, y1 + maxSpace + borderWidth);
               cr.lineTo(x2 + borderWidth, y1 - borderWidth);
               cr.lineTo(x2 - maxSpace - borderWidth, y1 - borderWidth);
            } else {
               cr.moveTo(x1 + maxSpace + borderWidth, y1 - borderWidth);
               cr.lineTo(x1 - borderWidth, y1 + maxSpace + borderWidth);
               cr.lineTo(x1 - borderWidth, y1 - borderWidth);
               cr.lineTo(x1 + maxSpace + borderWidth, y1 - borderWidth);
            }
         } else {
            if(sourceAllocation.x1 < center) {
               cr.moveTo(x2 + borderWidth, y2 - maxSpace - borderWidth);
               cr.lineTo(x2 - maxSpace - borderWidth, y2 + borderWidth);
               cr.lineTo(x2 + borderWidth, y2 + borderWidth);
               cr.lineTo(x2 + borderWidth, y2 - maxSpace - borderWidth);
            } else {
               cr.moveTo(x1 - borderWidth, y2 - maxSpace - borderWidth);
               cr.lineTo(x1 + maxSpace + borderWidth, y2 + borderWidth);
               cr.lineTo(x1 - borderWidth, y2 + borderWidth);
               cr.lineTo(x1 - borderWidth, y2 - maxSpace - borderWidth);
            }
         }
         try {
         Clutter.cairo_set_source_color(cr, this.selectedColor);
         cr.fillPreserve();
         Clutter.cairo_set_source_color(cr, borderColor);
         cr.setLineWidth(1);
         cr.stroke();
         } catch(e) {
            Main.notify("error", e.message);
         }
      }
   }
};

function ConfigurableMenu(launcher, orientation) {
   this._init(launcher, orientation);
}

ConfigurableMenu.prototype = {
   __proto__: Applet.AppletPopupMenu.prototype,

   _init: function(launcher, orientation) {
      PopupMenu.PopupMenuBase.prototype._init.call (this, launcher.actor, 'popup-menu-content');

      this._arrowAlignment = 0.0;
      this._arrowSide = orientation;

      this._boxPointer = new ConfigurablePointer(orientation,
                                                 { x_fill: true,
                                                   y_fill: true,
                                                   x_align: St.Align.START });
      this.actor = this._boxPointer.actor;
      this.actor._delegate = this;
      this.actor.style_class = 'popup-menu-boxpointer';
      this.actor.connect('key-press-event', Lang.bind(this, this._onKeyPressEvent));

      this._boxWrapper = new Cinnamon.GenericContainer();
      this._boxWrapper.connect('get-preferred-width', Lang.bind(this, this._boxGetPreferredWidth));
      this._boxWrapper.connect('get-preferred-height', Lang.bind(this, this._boxGetPreferredHeight));
      this._boxWrapper.connect('allocate', Lang.bind(this, this._boxAllocate));
      this._boxPointer.bin.set_child(this._boxWrapper);
      this._boxWrapper.add_actor(this.box);
      this.actor.add_style_class_name('popup-menu');

      global.focus_manager.add_group(this.actor);
      this.actor.reactive = true;

      Main.uiGroup.add_actor(this.actor);
      this.actor.hide();     
   },

   setArrow: function(arrow) {
      this._boxPointer.setArrow(arrow);
   },

   fixToCorner: function(fixCorner) {
      this._boxPointer.fixToCorner(fixCorner);
   },

   setResizeArea: function(resizeSize) {
      this._boxPointer.setResizeArea(resizeSize);
   },

   setResizeAreaColor: function(resizeColor) {
      this._boxPointer.setResizeAreaColor(resizeColor);
   }
};

function SpecialBookmarks(name, icon, path) {
   this._init(name, icon, path);
}

SpecialBookmarks.prototype = {

   _init: function(name, icon, path) {
      this.name = name;
      this._icon = icon;
      this._path = path;
      this.id = "bookmark:file://" + this._path;
   },

   launch: function() {
      Util.spawnCommandLine('xdg-open ' + this._path);
   },

   iconFactory: function(iconSize) {
      return new St.Icon({icon_name: this._icon, icon_size: iconSize, icon_type: St.IconType.FULLCOLOR});
   }
};


function AccessibleMetaData(parent, onChangeCallBack) {
   this._init(parent, onChangeCallBack);
}

AccessibleMetaData.prototype = {

   _init: function(parent, onChangeCallBack) {
      try {
         this.parent = parent;
         this.onChangeCallBack = onChangeCallBack;
         let config_source = GLib.get_home_dir() + "/.local/share/cinnamon/applets/" + parent.uuid + "/accessible.json";
         let config_path = GLib.get_home_dir() + "/.config/" + parent.uuid + "/accessible.json";
         this.metaDataFile = Gio.File.new_for_path(config_path);
         if(!this.metaDataFile.query_exists(null)) {
            if(!this._createSettingsFile(config_source)) {
               global.logError("Problem initializing settings...");
            }
         } else {
            if (!this.updateSettingsFile(config_source)) {
                global.logError("Problem updating settings...");
            }
         }
         this._loadMetaData();
      } catch(e) {
         Main.notify("Eroor: " + e.message);
      }

   },

   _isDirectory: function(fDir) {
      try {
         let info = fDir.query_filesystem_info("standard::type", null);
         if((info)&&(info.get_file_type() != Gio.FileType.DIRECTORY))
            return true;
      } catch(e) {
      }
      return false;
   },

   _makeDirectoy: function(fDir) {
      if(!this._isDirectory(fDir))
         this._makeDirectoy(fDir.get_parent());
      if(!this._isDirectory(fDir))
         fDir.make_directory(null);
   },

   _isBookmarks: function(bookmark) {
      let listBookmarks = this.parent._listBookmarks();
      for(let i = 0; i < listBookmarks.length; i++) {
         if(listBookmarks[i].id == bookmark)
            return true;
      }
      return false;
   },

   _loadMetaData: function() {
      try {
         let metadataContents = Cinnamon.get_file_contents_utf8_sync(this.metaDataFile.get_path());
         let checksum = global.get_md5_for_string(metadataContents);
         try {
            this.meta = JSON.parse(metadataContents);
         } catch (e) {
            global.logError("Cannot parse settings schema file... Error is: " + e);
            return false;
         }
      } catch (e) {
         global.logError('Failed to load/parse accessible.json', e);
      }
   },

   _createSettingsFile: function(origDataPath) {
      let origDataFile = Gio.File.new_for_path(origDataPath);

      if(!this.metaDataFile.get_parent().query_exists(null)) {
         this.metaDataFile.get_parent().make_directory_with_parents(null);
      }
      let origDataContents = Cinnamon.get_file_contents_utf8_sync(origDataFile.get_path());
      let checksum = global.get_md5_for_string(origDataContents);

      let init_json
      try {
         init_json = JSON.parse(origDataContents);
      } catch (e) {
         global.logError("Cannot parse settings schema file... Error is: " + e);
         return false;
      }

      for (let key in init_json) {
         init_json[key]["value"] = init_json[key]["default"]
      }
      init_json["__md5__"] = checksum;
      let out_file = JSON.stringify(init_json, null, 4);

      let fp = this.metaDataFile.create(0, null);
      fp.write(out_file, null);
      fp.close(null);

      return true;
   },

   updateSettingsFile: function(origDataPath) {
      let orig_file = Gio.File.new_for_path(origDataPath);
      if (!orig_file.query_exists(null)) {
         global.logWarning("Failed to locate settings schema file to check for updates...");
         global.logWarning("Something may not be right");
         return false;
      }
      let init_file_contents = Cinnamon.get_file_contents_utf8_sync(orig_file.get_path());
      let checksum = global.get_md5_for_string(init_file_contents);

      let existing_settings_file = Cinnamon.get_file_contents_utf8_sync(this.metaDataFile.get_path());
      let existing_json;
      let new_json;
      try {             
          new_json = JSON.parse(init_file_contents);
      } catch (e) {
          global.logError("Problem parsing " + orig_file.get_path() + " while preparing to perform upgrade.");
          global.logError("Skipping upgrade for now - something may be wrong with the new settings schema file.");
          return false;
      }
      try {
          existing_json = JSON.parse(existing_settings_file);
      } catch (e) {
          global.logError("Problem parsing " + this.metaDataFile.get_path() + " while preparing to perform upgrade.");
          global.log("Re-creating settings file.");
          this.metaDataFile.delete(null, null);
          return this._createSettingsFile(origDataPath);
      }           
      if(existing_json["__md5__"] != checksum) {
         global.log("Updated settings file detected.  Beginning upgrade of existing settings");
         return this._doUpgrade(new_json, existing_json, checksum);
      } else {
         return true;
      }
   },

   _doUpgrade: function(new_json, old_json, checksum) {
      /* We're going to iterate through all the keys in the new settings file
       * Where the key names and types match up, we'll check the current value against
       * the new max/mins or other factors (if applicable) and add the 'value' key to the new file.
       *
       * If the old setting-key doesn't exist in the new file, we'll drop it entirely.
       * If there are new keys, we'll assign the default value like normal.
       */
       for(let key in new_json) {
          if(key in old_json) {
             if(new_json[key]["type"] == old_json[key]["type"]) {
                if(this._sanityCheck(old_json[key]["value"], new_json[key])) {
                   new_json[key]["value"] = old_json[key]["value"];
                } else {
                   new_json[key]["value"] = new_json[key]["default"];
                }
             } else {
                new_json[key]["value"] = new_json[key]["default"];
             }
          } else {
             new_json[key]["value"] = new_json[key]["default"];
          }
       }
       new_json["__md5__"] = checksum;

       let out_file = JSON.stringify(new_json, null, 4);

       if(this.metaDataFile.delete(null, null)) {
          let fp = this.metaDataFile(0, null);
          fp.write(out_file, null);
          fp.close;
          global.log("Upgrade complete");
          return true;
       } else {
          global.logError("Failed to gain write access to save updated settings...");
          return false;
       }
   },

   _sanityCheck: function(val, setting) {
      let found;
      switch (setting["type"]) {
         case "spinbutton":
         case "scale":
            return (val < setting["max"] && val > setting["min"]);
            //break;
         case "combobox":
            found = false;
            for(let opt in setting["options"]) {
               if(val == setting["options"][opt]) {
                  found = true;
                  break;
               }
            }
            return found;
            //break;
         case "radiogroup":
            found = false;
            for (let opt in setting["options"]) {
               if (val == setting["options"][opt] || setting["options"][opt] == "custom") {
                  found = true;
                  break
               }
            }
            return found;
            //break;
         default:
            return true;
            //break;
      }
      return true;
   },

   _saveMetaData: function() {
      try {
         let metadataContents = Cinnamon.get_file_contents_utf8_sync(this.metaDataFile.get_path());
         let raw_file = JSON.stringify(this.meta, null, 4);
         if(this.metaDataFile.delete(null, null)) {
            let fp = this.metaDataFile.create(0, null);
            fp.write(raw_file, null);
            fp.close;
            if(this.onChangeCallBack)
               this.onChangeCallBack();
         } else {
            global.logError('Failed gain write access to accessible.json');
         }
      } catch (e) {
         global.logError('Failed gain write access to accessible.json', e);
      }
   },

   _removeMetaData: function() {
      let file = Gio.File.new_for_path(this.metaDataFile.get_path());
      if(file.query_exists(null)) {
         try {
            file.delete(null, null);
         } catch (e) {
            global.logError("Problem removing desklet config file during cleanup.  UUID is " + uuid + " and filename is " + config_path);
         }
      }
   },

   getPlacesList: function() {
      let placesString = this.meta["list-places"];
      let listPlaces = placesString.split(",");
      let pos = 0;
      while(pos < listPlaces.length) {
         if((listPlaces[pos] == "")||(!this._isBookmarks(listPlaces[pos])))
            listPlaces.splice(pos, 1);
         else
            pos++;
      }
      return listPlaces;
   },

   setPlacesList: function(listPlaces) {
      let result = "";
      for(let i = 0; i < listPlaces.length - 1; i++) {
         if(listPlaces[i] != "")
            result += listPlaces[i] + ",";
      }
      if((listPlaces.length > 0)&&(listPlaces[listPlaces.length-1] != ""))
         result += listPlaces[listPlaces.length-1];
      this.meta["list-places"] = result;
      this._saveMetaData();
   },

   isInPlacesList: function(placeId) {
      return (this.getPlacesList().indexOf(placeId) != -1);
   },

   getAppsList: function() {
      let appsString = this.meta["list-apps"];
      let listApps = appsString.split(",");
      let appSys = Cinnamon.AppSystem.get_default();
      let pos = 0;
      while(pos < listApps.length) {
         if((listApps[pos] == "")||(!appSys.lookup_app(listApps[pos])))
            listApps.splice(pos, 1);
         else
            pos++;
      }
      return listApps;
   },

   setAppsList: function(listApps) {
      let result = "";
      for(let i = 0; i < listApps.length - 1; i++) {
         if(listApps[i] != "")
            result += listApps[i] + ",";
      }
      if((listApps.length > 0)&&(listApps[listApps.length-1] != ""))
         result += listApps[listApps.length-1];
      this.meta["list-apps"] = result;
      this._saveMetaData();
   },

   isInAppsList: function(appId) {
      return (this.getAppsList().indexOf(appId) != -1);
   }
};

function MyApplet(metadata, orientation, panel_height, instance_id) {
   this._init(metadata, orientation, panel_height, instance_id);
}

MyApplet.prototype = {
   __proto__: CinnamonMenu.MyApplet.prototype,

   _init: function(metadata, orientation, panel_height, instance_id) {
      Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
      try {
         this.deltaMinResize = 20;
         this.aviableWidth = 0;
         this.uuid = metadata["uuid"];
         this.allowFavName = false;
         this.iconAppSize = 22;
         this.iconCatSize = 22;
         this.iconMaxFavSize = 20;
         this.iconPowerSize = 20;
         this.iconHoverSize = 68;
         this.iconAccessibleSize = 68;
         this.iconView = false;
         this.iconViewCount = 1;
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
         this.showTimeDate = false;
         this.timeFormat = "%H:%M";
         this.dateFormat = "%A,%e %B";
         this.appTitleSize = 10;
         this.appDescriptionSize = 8;
         this.showAppTitle = true;
         this.showAppDescription = true;
         this.controlingSize = false;
         this.minimalWidth = -1;
         this.minimalHeight = -1;

         this.RecentManager = new DocInfo.DocManager();

         this.menu = new ConfigurableMenu(this, orientation);
         this.menu.actor.connect('motion-event', Lang.bind(this, this._onResizeMotionEvent));
         this.menu.actor.connect('button-press-event', Lang.bind(this, this._onBeginResize));
         this.menu.actor.connect('leave-event', Lang.bind(this, this._disableOverResizeIcon));
         this.menu.actor.connect('button-release-event', Lang.bind(this, this._disableResize));
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
         this.menu.actor.add_style_class_name('menu-background');


         this.menuManager = new PopupMenu.PopupMenuManager(this);
         this.menuManager.addMenu(this.menu);   
         this.actor.connect('key-press-event', Lang.bind(this, this._onSourceKeyPress));
         this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPressEvent));
         //this._keyFocusNotifyIDSignal = global.stage.connect('notify::key-focus', Lang.bind(this, this._onKeyFocusChanged));

         this.settings = new Settings.AppletSettings(this, this.uuid, instance_id);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-recent", "showRecent", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-places", "showPlaces", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-hover", "activateOnHover", this._updateActivateOnHover, null);                        
         this.settings.bindProperty(Settings.BindingDirection.IN, "menu-icon", "menuIcon", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "menu-label", "menuLabel", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "search-filesystem", "searchFilesystem", null, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "hover-delay", "hover_delay_ms", this._update_hover_delay, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "enable-autoscroll", "autoscroll_enabled", this._update_autoscroll, null);

//My Setting
         this.settings.bindProperty(Settings.BindingDirection.IN, "theme", "theme", this._onThemeChange, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "power-theme", "powerTheme", this._onThemePowerChange, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-view-item", "showView", this._setVisibleViewControl, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "view-item", "iconView", this._changeView, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-press", "activateOnPress", null, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "power-box", "showPowerBox", this._setVisiblePowerBox, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "accessible-box", "showAccessibleBox", this._setVisibleAccessibleBox, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "accessible-icons", "showAccessibleIcons", this._setVisibleAccessibleIcons, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "categories-icons", "showCategoriesIcons", this._setVisibleCategoriesIcons, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-app-size", "iconAppSize", this._refreshApps, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-cat-size", "iconCatSize", this._refreshApps, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-max-fav-size", "iconMaxFavSize", this._setIconMaxFavSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-power-size", "iconPowerSize", this._setIconPowerSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-control-size", "iconControlSize", this._setIconControlSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-hover-size", "iconHoverSize", this._setIconHoverSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "icon-accesible-size", "iconAccessibleSize", this._setIconAccessibleSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-favorites", "showFavorites", this._setVisibleFavorites, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "favorites-lines", "favoritesLinesNumber", this._setVisibleFavorites, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-hover-icon", "showHoverIcon", this._setVisibleHoverIcon, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "hover-icon-border", "hoverBorderSize", this._updateBorderHoverSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-power-buttons", "showPowerButtons", this._setVisiblePowerButtons, null);
         
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-time-date", "showTimeDate", this._setVisibleTimeDate, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "time-format", "timeFormat", this._updateTimeDateFormat, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "date-format", "dateFormat", this._updateTimeDateFormat, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-app-title", "showAppTitle", this._updateAppSelectedText, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "app-title-size", "appTitleSize", this._updateAppSelectedText, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-app-description", "showAppDescription", this._updateAppSelectedText, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "app-description-size", "appDescriptionSize", this._updateAppSelectedText, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "automatic-size", "automaticSize", this._setAutomaticSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "full-screen", "fullScreen", this._setFullScreen, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "width", "width", this._updateSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "height", "height", this._updateSize, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-favorites", "scrollFavoritesVisible", this._setVisibleScrollFav, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-categories", "scrollCategoriesVisible", this._setVisibleScrollCat, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-applications", "scrollApplicationsVisible", this._setVisibleScrollApp, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-accessible", "scrollAccessibleVisible", this._setVisibleScrollAccess, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "spacer-line", "showSpacerLine", this._setVisibleSpacerLine, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "spacer-size", "spacerSize", this._updateSpacerSize, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-box-pointer", "showBoxPointer", this._setVisibleBoxPointer, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "fix-menu-corner", "fixMenuCorner", this._setFixMenuCorner, null);


         this._searchInactiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                  icon_name: 'edit-find',
                                                  icon_type: St.IconType.SYMBOLIC });
         this._searchActiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                icon_name: 'edit-clear',
                                                icon_type: St.IconType.SYMBOLIC });

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
         this.accessibleMetaData = new AccessibleMetaData(this, Lang.bind(this, this._onChangeAccessible));
         this._pathCompleter = new Gio.FilenameCompleter();
         this._pathCompleter.set_dirs_only(false);
         this.lastAcResults = new Array();

         this._updateComplete();
      }
      catch (e) {
         Main.notify("ErrorMain:", e.message);
         global.logError(e);
      }
   },

   _onChangeAccessible: function() {
      if(this.staticBox)
         this.staticBox.refreshAccessibleItems();
   },

   on_orientation_changed: function(orientation) {
      this.orientation = orientation;
      this._updateComplete();   
   },

   _onMenuKeyPress: function(actor, event) {
      try {
//Main.notify("ok" + actor);
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
        if((this.bttChanger)&&(this.bttChanger.getSelected() == _("All Applications"))&&(actor == this.searchEntryText)) {
           if((symbol != Clutter.Return) && (symbol != Clutter.KEY_Return) && (symbol != Clutter.KP_Enter) &&
              (symbol != Clutter.KEY_Right) && (symbol != Clutter.KEY_Up) && (symbol != Clutter.KEY_Down) &&
              (symbol != Clutter.KEY_Left) && (symbol != Clutter.Escape) && (symbol != Clutter.Tab))
              if(this.searchEntry.text == "")
                 this.bttChanger.activateNext();
        }

        if(actor._delegate instanceof FavoritesButtonExtended) {
           return this._navegateFavBox(symbol, actor);
        } else if(actor == this.powerBox.actor) {
           return this._navegatePowerBox(symbol, actor); 
        } else if((this.staticBox)&&(actor == this.staticBox.actor)) {
           return this._navegateStaticBox(symbol, actor); 
        } else if((this.bttChanger)&&(actor == this.bttChanger.actor)) {
           return this._navegateBttChanger(symbol);
        } else if(actor == this.hover.actor) {
           return this._navegateHoverIcon(symbol, actor);
        } else if(actor == this.hover.menu.actor) {
           return this._navegateHoverMenu(symbol, actor);
        } else if(this._activeContainer === null) {
           item_actor = this._navegationInit(symbol);
        } else if(this._activeContainer == this.applicationsBox) {
           item_actor = this._navegateAppBox(symbol, this._selectedItemIndex, this._selectedRowIndex);
        } else if(this._activeContainer == this.categoriesBox) {
           item_actor = this._navegateCatBox(symbol, this._selectedRowIndex);
        } else if (this.searchFilesystem && (this._fileFolderAccessActive || symbol == Clutter.slash)) {
           return this._searchFileSystem(symbol);
        } else {
           return false;
        }
        if(item_actor == this.searchEntry) {
           return true;
        }
        else if(!item_actor) {
           return false;
        }
        //Main.notify("Item:" + item_actor._delegate);
        if(item_actor._delegate) {
           item_actor._delegate.emit('enter-event');
        }
        return true;
      }
      catch(e) {
        Main.notify("ErrorKey", e.message);
      }
      return false;
   },

   _changeFocusElement: function(elementActive) {
      let tbttChanger = null;
      let staticB = null;
      let favElem = null;
      if(this.bttChanger) tbttChanger = this.bttChanger.actor;
      if(this.staticBox) staticB = this.staticBox.actor;
      if(this.favoritesObj.getFirstElement()) favElem = this.favoritesScrollBox.actor;
      let activeElements = [this.hover.actor, staticB, this.powerBox.actor, tbttChanger, this.searchEntry, favElem];
      let actors = [this.hover.actor, staticB, this.powerBox.actor, tbttChanger, this.searchEntry, this.favoritesObj.getFirstElement()];
      let index = actors.indexOf(elementActive);
      let selected = index + 1;
      while((selected < activeElements.length)&&((!activeElements[selected])||(!activeElements[selected].visible))) {
         selected++;
      }
      if(selected < activeElements.length) {
         return actors[selected];
      }
      let selected = 0;
      while((selected < index)&&((!activeElements[selected])||(!activeElements[selected].visible))) {
         selected++;
      }
      this.hover.refreshFace();
      this.selectedAppBox.setSelectedText("", "");
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
         item_actor = this.searchEntry;
      } else if((symbol == Clutter.KEY_Right)||(symbol == Clutter.KEY_Up)||(symbol == Clutter.KEY_Down)) {
         if(!this.operativePanel.visible) {
            this.fav_actor = this._changeFocusElement(this.searchEntry);
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            item_actor = this.searchEntry;
            return item_actor;
         }
         this._activeContainer = this.applicationsBox;
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(0).get_child_at_index(0);
         this._previousTreeSelectedActor._delegate.emit('enter-event');
         item_actor = this.appBoxIter.getFirstVisible();
         this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._selectedRowIndex = this.appBoxIter.getInternalIndexOfChild(item_actor);
      }
      //global.stage.set_key_focus(this.powerBox.actor);
      return item_actor;
   },

   _navegateAppBox: function(symbol, index, rowIndex) {
      let item_actor;
      if(!this.operativePanel.visible) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
         return item_actor;
      }
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
      }
      else if(symbol == Clutter.KEY_Up) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
      } 
      else if(symbol == Clutter.KEY_Down) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
      }
      else if(symbol == Clutter.KEY_Right) {
         if(this._previousTreeSelectedActor)
            this._previousTreeSelectedActor._delegate.emit('enter-event');
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getRightVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
      }
      else if(symbol == Clutter.KEY_Left) {//&& !this.searchActive
         if(this._previousTreeSelectedActor)
            this._previousTreeSelectedActor._delegate.emit('enter-event');
         if(index == 0) {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
            item_actor = (this._previousTreeSelectedActor) ? this._previousTreeSelectedActor : this.catBoxIter.getFirstVisible();
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor = item_actor;
            this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
            this.hover.refreshFace();
            this.selectedAppBox.setSelectedText("", "");
         } else {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
            item_actor = this.appBoxIter.getLeftVisible(this._previousSelectedActor);
            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
            index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
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
      if(!this.operativePanel.visible) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
         return item_actor;
      }
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
      }
      else if(this.categoriesBox.get_vertical()) {
         if(symbol == Clutter.KEY_Up) {
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
            this._previousTreeSelectedActor._delegate.isHovered = false;
            item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
         }
         else if(symbol == Clutter.KEY_Down) {
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
            this._previousTreeSelectedActor._delegate.isHovered = false;
            item_actor = this.catBoxIter.getNextVisible(this._activeActor)
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor._delegate.emit('leave-event');
            this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
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
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
            this._previousTreeSelectedActor._delegate.isHovered = false;
            item_actor = this.catBoxIter.getNextVisible(this._activeActor)
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor._delegate.emit('leave-event');
            this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
         }
         else if(symbol == Clutter.KEY_Left) {
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
            this._previousTreeSelectedActor._delegate.isHovered = false;
            item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
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
         this.fav_actor = this._changeFocusElement(this.favoritesScrollBox.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         return true;
      } else {
         this.fav_actor = this.favoritesObj.navegateFavBox(symbol, actor);
         let fav_obj = this._searchFavActor(this.fav_actor);
         if(fav_obj) {
            this.hover.refreshApp(fav_obj.app);
            if(fav_obj.app.get_description())
               this.selectedAppBox.setSelectedText(fav_obj.app.get_name(), fav_obj.app.get_description().split("\n")[0]);
            else
               this.selectedAppBox.setSelectedText(fav_obj.app.get_name(), "");
         }
         this.favoritesScrollBox.scrollToActor(this.fav_actor._delegate.actor);
         return true;
      }
   },

   _navegatePowerBox: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.powerBox.disableSelected();
         this.fav_actor = this._changeFocusElement(this.powerBox.actor);
         //global.stage.set_key_focus(this.fav_actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else {
         this.powerBox.navegatePowerBox(symbol, actor);
      }
      return true;
   },

   _navegateStaticBox: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.staticBox.disableSelected();
         this.fav_actor = this._changeFocusElement(this.staticBox.actor);
         //global.stage.set_key_focus(this.fav_actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else {
         return this.staticBox.navegateStaticBox(symbol, actor);
      }
      return true;
   },

   _navegateBttChanger: function(symbol) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.bttChanger.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      } else if((symbol == Clutter.Return) || (symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         this.bttChanger.activateNext();
      }
      return true;
   },

   _navegateHoverIcon: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.hover.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      return true;
   },

   _navegateHoverMenu: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.hover.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      } else {
         this.hover.navegateHoverMenu(symbol, actor);
      }
      return true;
   },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
   },

   _searchFavActor: function(actor) {
      for(let key in this._favoritesButtons) {
         if(this._favoritesButtons[key].actor == actor)
           return this._favoritesButtons[key];
      }
      return null;
   },

   _updateView: function() {
      this._clearView();
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
// + 42
      this.aviableWidth = this.applicationsScrollBox.actor.get_allocation_box().x2-this.applicationsScrollBox.actor.get_allocation_box().x1 - 42;
      if((this.aviableWidth > 0)&&(this._applicationsBoxWidth > 0)) {
         this.iconViewCount = Math.floor(this.aviableWidth/this._applicationsBoxWidth);
         if(this.iconViewCount*this._applicationsBoxWidth > this.aviableWidth)
            this.iconViewCount--;
         if(this.iconViewCount < 1)
            this.iconViewCount = 1; 
      }

      this.appBoxIter.setNumberView(this.iconViewCount);

      let viewBox, currValue, falseActor;
      for(let i = 0; i < this.iconViewCount; i++) {
         viewBox = new St.BoxLayout({ vertical: true, width: (this._applicationsBoxWidth) });
         this.applicationsBox.add(viewBox, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: true });
      }
      try {
         viewBox = this.applicationsBox.get_children();
         for(let i = 0; i < visibleAppButtons.length; i += this.iconViewCount) {
            for(let j = 0; j < this.iconViewCount; j++) {
               currValue = i + j;
               if((currValue < visibleAppButtons.length)&&(viewBox[j])) {
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
       // Main.notify("Error10", e.message);
      }
   },

   _clearView: function() {
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
   },

   _update_autoscroll: function() {
      this.applicationsScrollBox.setAutoScrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.setAutoScrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.setAutoScrolling(this.autoscroll_enabled);
      if(this.staticBox)
         this.staticBox.setAutoScrolling(this.autoscroll_enabled);
   },

   _setIconMaxFavSize: function() {
      this._refreshApps();
      this._refreshFavs();
   },

   _setIconControlSize: function() {
      if(this.controlView) {
         this.controlView.setIconSize(this.iconControlSize);
         this._updateSize();
      }
   },

   _setVisiblePowerBox: function() {
      if(this.powerBox) {
         this.powerBox.setSpecialColor(this.showPowerBox);
      }
   },

   _setVisibleAccessibleBox: function() {
      if(this.staticBox) {
         this.staticBox.setSpecialColor(this.showAccessibleBox);
      }
   },

   _setVisibleAccessibleIcons: function() {
      if(this.staticBox) {
         this.staticBox.setIconsVisible(this.showAccessibleIcons);
         this._updateSize();
      }
   },

   _setVisibleCategoriesIcons: function() {
      this._setCategoriesIconsVisible(this.showCategoriesIcons);
      this._updateSize();
   },

   _setIconPowerSize: function() {
      if(this.powerBox) {
         this.powerBox.setIconSize(this.iconPowerSize);
         this._updateSize();
      }
   },

   _setIconHoverSize: function() {
      if(this.hover) {
         this.hover.setIconSize(this.iconHoverSize);
         this._updateSize();
      }
   },

   _setIconAccessibleSize: function() {
      if(this.staticBox) {
         this.staticBox.setIconSize(this.iconAccessibleSize);
         this._updateSize();
      }
   },

   _setVisibleViewControl: function() {
      if(this.controlView) {
         this.controlView.actor.visible = this.showView;
         this._updateSize();
      }
   },

   _changeView: function() {
      if(this.controlView) {
         this.controlView.changeViewSelected(this.iconView);
         this._refreshApps();
         this._refreshFavs();
         this.updateSize();
      }
   },

   _setVisibleFavorites: function() {
      this.favoritesScrollBox.actor.visible = this.showFavorites;
      this._refreshFavs();
         this.updateSize();
   },

   _setVisiblePowerButtons: function() {
      this.powerBox.actor.visible = this.showPowerButtons;
      this._updateSize();
   },

   _setVisibleHoverIcon: function() {
      this.hover.actor.visible = this.showHoverIcon;
      if(this.hover.menu.actor.visible)
         this.hover.menu.actor.visible = this.showHoverIcon;
      this._updateSize();
   },

   _updateBorderHoverSize: function() {
      this.hover.setBorderSize(this.hoverBorderSize);
   },

   _setVisibleTimeDate: function() {
      if(this.selectedAppBox)
         this.selectedAppBox.setDateTimeVisible(this.showTimeDate);
   },

   _setVisibleScrollFav: function() {
      if(this.favoritesScrollBox) {
         this.favoritesScrollBox.setScrollVisible(this.scrollFavoritesVisible);
      }
   },

   _setVisibleScrollCat: function() {
      if(this.categoriesScrollBox) {
         this.categoriesScrollBox.setScrollVisible(this.scrollCategoriesVisible);
      }
   },

   _setVisibleScrollApp: function() {
      if(this.applicationsScrollBox) {
         this.applicationsScrollBox.setScrollVisible(this.scrollApplicationsVisible);
      }
   },

   _setVisibleScrollAccess: function() {
      if(this.staticBox) {
         this.staticBox.setScrollVisible(this.scrollAccessibleVisible);
      }
   },

   _setVisibleSpacerLine: function() {
      this.powerBox.setSeparatorLine(this.showSpacerLine);
      if(this.staticBox)
         this.staticBox.setSeparatorLine(this.showSpacerLine);
      if(this.spacerApp)
         this.spacerApp.setLineVisible(this.showSpacerLine);
      if(this.spacerWindows)
         this.spacerWindows.setLineVisible(this.showSpacerLine);
   },

   _updateSpacerSize: function() {
      this.powerBox.setSeparatorSpace(this.spacerSize);
      if(this.staticBox)
         this.staticBox.setSeparatorSpace(this.spacerSize);
      if(this.spacerApp)
         this.spacerApp.setSpace(this.spacerSize);
      if(this.spacerWindows)
         this.spacerWindows.setSpace(this.spacerSize);
   },

   _setVisibleBoxPointer: function() {
      this.menu._boxPointer.setArrow(this.showBoxPointer);
   },

   _setFixMenuCorner: function() {
      this.menu.fixToCorner(this.fixMenuCorner);
   },

   _setCategoriesIconsVisible: function() {
      for(let i = 0; i < this._categoryButtons.length; i++)
         this._categoryButtons[i].setIconVisible(this.showCategoriesIcons);
   },

   _updateAppSelectedText: function() {
      this.selectedAppBox.setTitleVisible(this.showAppTitle);
      this.selectedAppBox.setDescriptionVisible(this.showAppDescription);
      this.selectedAppBox.setTitleSize(this.appTitleSize);
      this.selectedAppBox.setDescriptionSize(this.appDescriptionSize);
      this._updateSize();
   },

   _updateTimeDateFormat: function() {
      this.selectedAppBox.setDateFormat(this.dateFormat);
      this.selectedAppBox.setTimeFormat(this.timeFormat);
   },

   _onThemeChange: function() {
      this.updateTheme = true;
      this._updateComplete();
      this.menu.open();
   },

   _onThemePowerChange: function() {
      if(this.powerBox)
         this.powerBox.setTheme(this.powerTheme);
      this._updateSize();
   },

   _updateComplete: function() {
      if(this.staticBox) {
         this.staticBox.actor.get_parent().remove_actor(this.staticBox.actor);
         this.staticBox.actor.destroy(); 
         this.staticBox = null;
      }
      if(this.bttChanger)
         this.bttChanger.actor.destroy();
      this._updateMenuSection();
      this._setVisibleBoxPointer();
      this._setFixMenuCorner();
      this._display();
      this._setVisibleViewControl();
      this._setVisibleTimeDate();
      this._setVisibleScrollFav();
      this._setVisibleScrollCat();
      this._setVisibleScrollApp();
      this._setVisibleScrollAccess();
      this._setVisibleSpacerLine();
      this._updateSpacerSize();
      this._updateBorderHoverSize();
      this.favoritesScrollBox.actor.visible = this.showFavorites;
      this.selectedAppBox.setTitleVisible(this.showAppTitle);
      this.selectedAppBox.setDescriptionVisible(this.showAppDescription);
      this.selectedAppBox.setTitleSize(this.appTitleSize);
      this.selectedAppBox.setDescriptionSize(this.appDescriptionSize);
      this._setCategoriesIconsVisible(this.showCategoriesIcons);
      this._updateTimeDateFormat();
      this._update_autoscroll();
      this._updateActivateOnHover();
      this._updateIconAndLabel();
      this._update_hover_delay();
      if(this.hover) {
         this.hover.actor.visible = this.showHoverIcon;
         if(this.hover.menu.actor.visible)
            this.hover.menu.actor.visible = this.showHoverIcon;
         this.hover.setIconSize(this.iconHoverSize);
      }
      if(this.staticBox) {
         this.staticBox.setIconSize(this.iconAccessibleSize);
         this.staticBox.setSpecialColor(this.showAccessibleBox);
         this.staticBox.setIconsVisible(this.showAccessibleIcons);
      }
      if(this.controlView) {
         this.controlView.setIconSize(this.iconControlSize);
      }
      if(this.powerBox) {
         this.powerBox.setIconSize(this.iconPowerSize);
         this.powerBox.actor.visible = this.showPowerButtons;
         this.powerBox.setTheme(this.powerTheme);
         this.powerBox.setSpecialColor(this.showPowerBox);
      }
      this._refreshFavs();
      if(this.fullScreen) {
         if(this.controlView) {
            this.controlView.changeResizeActive(false);
            this.controlView.changeFullScreen(this.fullScreen);
         }
         this.menu._boxPointer.setArrow(false);
         this.menu.fixToCorner(true);
      } 
   },

   _setAutomaticSize: function() {
      if(this.controlView)
         this.controlView.changeResizeActive(false);      
      this._updateSize();
   },

   _setFullScreen: function() {
      if(this.controlView)
         this.controlView.changeFullScreen(this.fullScreen);
      if(this.fullScreen) {
         if(this.controlView)
            this.controlView.changeResizeActive(false);
         this.menu._boxPointer.setArrow(false);
         this.menu.fixToCorner(true);
      } else {
         this.menu._boxPointer.setArrow(this.showBoxPointer);
         this.menu.fixToCorner(this.fixMenuCorner);         
      }
      this._updateSize();
   },

   _updateSize: function() {
      if((this.mainBox)&&(this.displayed)) {
         let monitor = Main.layoutManager.findMonitorForActor(this.actor);
         if(this.fullScreen) {
            let panelTop = this._processPanelSize(false);
            let panelButton = this._processPanelSize(true);
            this.mainBox.set_width(monitor.width);
            this.mainBox.set_height(monitor.height - panelButton - panelTop);
            this._updateView();
         } else if(this.automaticSize) {
            this.mainBox.set_width(-1);
            this.mainBox.set_height(-1);
            this._clearView();
            if(this.bttChanger) {
               let operPanelVisible = this.operativePanel.visible;
               this.operativePanel.visible = true;
               this.favoritesScrollBox.actor.visible = false;
               this.height = this.mainBox.get_height();
               this.mainBox.set_height(this.height);
               this.operativePanel.visible = operPanelVisible;
               this.favoritesScrollBox.actor.visible = !operPanelVisible;
            } else {
               this.height = this.mainBox.get_height();
               this.mainBox.set_height(this.height);
            }
            this._updateView();
            this.width = this.mainBox.get_width();
            this.mainBox.set_width(this.width);
         } else {
            if(this.width > this.mainBox.get_width()) {
               if(this.width > monitor.width)
                  this.width = monitor.width;
               this.mainBox.set_width(this.width);
            } else {
               if(this.width > this.minimalWidth) {
                  this.mainBox.set_width(this.width);
                  this._clearView();
                  Mainloop.idle_add(Lang.bind(this, function() {//checking correct width and revert if it's needed.
                     let minWidth = this._minimalWidth();
                     if(this.width < minWidth) {
                        this.width = minWidth;
                        this.mainBox.set_width(this.width);
                        this._updateView();
                     }
                    // this.minimalWidth = minWidth;
                  }));
               }
            }
            let maxHeigth = monitor.height - this._processPanelSize(true) - this._processPanelSize(false);
            if(this.height > this.mainBox.get_height()) {
               if(this.height > maxHeigth)
                  this.height = maxHeigth;
               this.mainBox.set_height(this.height);
            } else {
               if(this.height > this.minimalHeight) {
                  this.mainBox.set_height(this.height);
                  this._clearView();
                  Mainloop.idle_add(Lang.bind(this, function() {//checking correct height and revert if it's needed.
                     let minHeight = this._minimalHeight();
                     if(this.height < minHeight) {
                        this.height = minHeight;
                        this.mainBox.set_height(this.height);
                        this._updateView();
                     }
                     this.minimalHeight = minHeight;
                  }));
               } else {
                  this.height = this.minimalHeight;
                  this.mainBox.set_height(this.height);
               }
            }
            this._updateView();
         }
      }
   },

   allocationWidth: function(actor) {
      return actor.get_allocation_box().x2-actor.get_allocation_box().x1;
   },

   allocationHeight: function(actor) {
      return actor.get_allocation_box().y2-actor.get_allocation_box().y1;
   },

   _minimalHeight: function() {
      let scrollBoxHeight =  this.controlSearchBox.get_height() + this.endHorizontalBox.get_height() + 10;
      if(!this.categoriesBox.get_vertical())
         scrollBoxHeight += this.categoriesBox.get_height();
      if(!this.favBoxWrapper.get_vertical())
         scrollBoxHeight += this.favBoxWrapper.get_height();
     if(scrollBoxHeight + 20 < 280)
         scrollBoxHeight = 280;
      return scrollBoxHeight + 20;
   },

   _minimalWidth: function() {
      let width = this.extendedBox.get_width();
      let interMint = 0;
      if(this.theme == "mint") {
         let operPanelVisible = this.operativePanel.visible;
         this.operativePanel.visible = true;
         this.favoritesScrollBox.actor.visible = false;
         interMint = this.extendedBox.get_width();
         this.operativePanel.visible = operPanelVisible;
         this.favoritesScrollBox.actor.visible = !operPanelVisible;
      }
      if(interMint > width)
         width = interMint;
      
      if(!this.categoriesBox.get_vertical()) {
         width = this.controlBox.get_width();
         if(this.hover.actor.visible)
           width += this.hover.actor.get_width() + this.hover.menu.actor.get_width();
         if((!this.favBoxWrapper.get_vertical())&&(this.favBoxWrapper.get_width() > width))
            width = this.favBoxWrapper.get_width();
      }
      if((this.staticBox)&&(this.staticBox.actor.visible))
         width += this.staticBox.actor.get_width() + 10;
      if((this.theme == "mint")||(this.theme == "windows7"))
         return width + 10;
      return width + 20;
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
         this.menu = new ConfigurableMenu(this, this.orientation);
         this.menu.actor.connect('motion-event', Lang.bind(this, this._onResizeMotionEvent));
         this.menu.actor.connect('button-press-event', Lang.bind(this, this._onBeginResize));
         this.menu.actor.connect('leave-event', Lang.bind(this, this._disableOverResizeIcon));
         this.menu.actor.connect('button-release-event', Lang.bind(this, this._disableResize));
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
         this.menu.actor.add_style_class_name('menu-background');
         this.menuManager.addMenu(this.menu);
      }
   },

   _onResizeMotionEvent: function(actor, event) {
      if(!this.actorResize) {
         let [mx, my] = event.get_coords();
         let [ax, ay] = actor.get_transformed_position();
         ar = ax + actor.get_width();
         at = ay + actor.get_height();
         if(this._isInsideMenu(mx, my, ax, ay, ar, at)) {
            if(this._correctPlaceResize(mx, my, ax, ay, ar, at)) {
               this._cursorChanged = true;
               global.set_cursor(Cinnamon.Cursor.DND_MOVE);
            } else if(this._cursorChanged) {
               this._cursorChanged = false;
               global.unset_cursor();
            }
         } else if(this._cursorChanged) {
            this._cursorChanged = false;
            global.unset_cursor();
         }
      }
   },

   _onBeginResize: function(actor, event) {
      this.actorResize = actor;
      let [mx, my] = event.get_coords();
      let [ax, ay] = actor.get_transformed_position();
      aw = actor.get_width();
      ah = actor.get_height();
      if(this._isInsideMenu(mx, my, ax, ay, aw, ah)) {
         if(this._correctPlaceResize(mx, my, ax, ay, aw, ah)) {
            this._findMouseDeltha();
            global.set_cursor(Cinnamon.Cursor.DND_MOVE);
            this._doResize();
         }
      }
   },

   _findMouseDeltha: function(mx, my) {
      if(this.actorResize) {
         this.mouseDx = 0;
         this.mouseDy = 0;
            this._updatePosResize();
         this.mouseDx = this.width - this.mainBox.get_width();
         this.mouseDy = this.height - this.mainBox.get_height();
      }
      
   },

   _disableResize: function() {
      this.actorResize = null;
      global.unset_cursor();
   },

   _disableOverResizeIcon: function() {
      if(!this.actorResize) {
         this._disableResize();
      }
   },

   _isInsideMenu: function(mx, my, ax, ay, aw, ah) {
      return ((this.controlingSize)&&(mx > ax)&&(mx < ax + aw)&&(my > ay)&&(my < ay + ah));
   },

   _correctPlaceResize: function(mx, my, ax, ay, aw, ah) {
      let monitor = Main.layoutManager.findMonitorForActor(this.actor);
      let middelScreen = (monitor.x + monitor.width)/2;
      let [cx, cy] = this.actor.get_transformed_position();
      switch (this.orientation) {
         case St.Side.TOP:
            if(my > ah - this.deltaMinResize) {
               if(cx > middelScreen)
                  return (mx < ax + this.deltaMinResize);
               return (mx > aw - this.deltaMinResize);
            }
            return false;
         case St.Side.BOTTOM:
            if(my < ay + this.deltaMinResize) {
               if(cx < middelScreen)
                  return (mx > aw - this.deltaMinResize);
               return  (mx < ax + this.deltaMinResize);
            }
            return false;
      }
      return false;
   },

   _doResize: function() {
      if(this.actorResize) {
         this._updatePosResize();
         this._updateSize();
         Mainloop.timeout_add(300, Lang.bind(this, this._doResize));
      }
   },

   _updatePosResize: function() {
      if(this.actorResize) {
         let [mx, my, mask] = global.get_pointer();
         let [ax, ay] = this.actorResize.get_transformed_position();
         aw = this.actorResize.get_width();
         ah = this.actorResize.get_height();
         let monitor = Main.layoutManager.findMonitorForActor(this.actor);
         let middelScreen = (monitor.x + monitor.width)/2;
         let [cx, cy] = this.actor.get_transformed_position();
         switch (this.orientation) {
            case St.Side.TOP:
               this.height = this.mainBox.get_height() + my - this._processPanelSize(false) - ah + 4 - this.mouseDy;
               if(cx < middelScreen)
                  this.width = mx - ax - this.mouseDx;
               else
                  this.width = this.mainBox.get_width() + ax - mx - this.mouseDx;
               break;
            case St.Side.BOTTOM:
               this.height = this.mainBox.get_height() + ay - my + 4 - this.mouseDy;
               if(cx < middelScreen)
                  this.width = mx - ax - this.mouseDx;
               else
                  this.width = this.mainBox.get_width() + ax - mx - this.mouseDx;
               break;
         }
      }
   },

   _processPanelSize: function(bottomPosition) {
      let panelHeight;
      let panelResizable = global.settings.get_boolean("panel-resizable");
      if(panelResizable) {
         if(bottomPosition) {
            panelHeight = global.settings.get_int("panel-bottom-height");
         }
         else {
            panelHeight = global.settings.get_int("panel-top-height");
         }
      }
      else {
         let themeNode = this.actor.get_theme_node();
         panelHeight = themeNode.get_length("height");
         if(!panelHeight || panelHeight == 0) {
            panelHeight = 25;
         }
      }
      return panelHeight;
   },

   _display: function() {
      try {
         this.minimalWidth = -1;
         this.minimalHeight = -1;
         this.displayed = false;
         if(this.selectedAppBox)
            this.selectedAppBox.setDateTimeVisible(false);
         this.allowFavName = false;
         this.bttChanger = null;
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

         this.standardBox = new St.BoxLayout({ vertical:false });

         this.rightPane = new St.BoxLayout({ vertical: true });        
//search
         this.controlSearchBox = new St.BoxLayout({ vertical: false });
         this.controlBox = new St.BoxLayout({ vertical: true });
         this.rightPane.add_actor(this.controlSearchBox);


         this.searchBox = new St.BoxLayout({ style_class: 'menu-search-box' });
         this.searchBox.set_style("padding-right: 0px; padding-left: 0px");

         this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                           hint_text: _("Type to search..."),
                                           track_hover: true,
                                           can_focus: true });
         this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

         this.controlSearchBox.add(this.controlBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.MIDDLE, y_fill: false, expand: false });
         this.searchActive = false;
         this.searchEntryText = this.searchEntry.clutter_text;
         this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
         this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this._previousSearchPattern = "";

         this.searchName = new St.Label({ style_class: 'menu-selected-app-title', text: _("Filter:"), visible: false });
         this.searchName.style="font-size: " + 10 + "pt";
         this.panelAppsName = new St.Label({ style_class: 'menu-selected-app-title', text: _("Favorites"), visible: false });
         this.panelAppsName.style="font-size: " + 10 + "pt";

         this.searchBox.add(this.searchName, {x_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, y_fill: false, expand: false });
         this.searchBox.add_actor(this.searchEntry);

         this.controlView = new ControlBox(this, this.iconControlSize);

//search
         this.hover = new HoverIcon(this, this.iconHoverSize);
         this.hover.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this.hover.menu.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));

         this.hoverBox = new St.BoxLayout({ vertical: false });
         this.hoverBox.add_actor(this.hover.actor);
         this.hoverBox.add_actor(this.hover.menu.actor);

         this.categoriesApplicationsBox = new CategoriesApplicationsBoxExtended();

         this.categoriesBox = new St.BoxLayout({ style_class: 'menu-categories-box', vertical: true });
         this.applicationsBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical: false });
         this.favBoxWrapper = new St.BoxLayout({ vertical: true });
         this.favoritesBox = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: true });
         this.favoritesBox.style = "padding-left: "+0+"px;padding-right: "+0+"px;margin:auto;";
         this.applicationsScrollBox = new ScrollItemsBox(this, this.applicationsBox, true);

         this.a11y_settings = new Gio.Settings({ schema: "org.cinnamon.desktop.a11y.applications" });
         this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
         this._updateVFade();

         this.endBox = new St.BoxLayout({ vertical: true });
         this.endHorizontalBox = new St.BoxLayout({ vertical: false });
         //this.endHorizontalBox.set_style("padding-right: 20px;");

         this.selectedAppBox = new SelectedAppBox(this, this.showTimeDate);
         this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });

         this.betterPanel = new St.BoxLayout({ vertical: false });
         this.operativePanel = new St.BoxLayout({ vertical: false });
         this.categoriesWrapper = new St.BoxLayout({ vertical: true });
         this.operativePanel.add(this.categoriesWrapper, { x_fill: true, y_fill: true, expand: false });

         this.mainBox = new St.BoxLayout({ vertical: false, style_class: 'menu-applications-box' });

         this.extendedBox = new St.BoxLayout({ vertical: true });
         this.extendedBox.add(this.standardBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
         this.spacerWindows = new SeparatorBox(this.showSpacerLine, this.spacerSize);
         this.spacerApp = new SeparatorBox(this.showSpacerLine, this.spacerSize);

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
            case "mint"              :
                          this.loadMint(); 
                          break;
            case "windows7"           :
                          this.loadWindows(); 
                          break;
            default                  :
                          this.loadClassic(); 
                          break;
         }

         this.operativePanel.add(this.applicationsScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
         this.rightPane.add(this.categoriesApplicationsBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});

         this.favoritesBox.add(this.favoritesObj.actor, { x_fill: true, y_fill: true, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: false });

         this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});

         this.categoriesApplicationsBox.actor.add(this.betterPanel, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});

         this.appBoxIter = new VisibleChildIteratorExtended(this, this.applicationsBox, this.iconViewCount);
         this.applicationsBox._vis_iter = this.appBoxIter;
         this.catBoxIter = new VisibleChildIteratorExtended(this, this.categoriesBox, 1);
         this.categoriesBox._vis_iter = this.catBoxIter;

         this._refreshApps();

         this.signalKeyPowerID = 0;
         this._update_autoscroll();
         
         section.actor.add_actor(this.mainBox);

         Mainloop.idle_add(Lang.bind(this, function() {
            this._clearAllSelections(true);
            this._applicationsBoxWidth = 0;   
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(this._applicationsButtons[i].actor.get_width() > this._applicationsBoxWidth)
                  this._applicationsBoxWidth = this._applicationsButtons[i].actor.get_width();
            }
            if(this.theme == "windows7") {
               this.searchEntry.set_width(this._applicationsBoxWidth);
            }
         }));
      } catch(e) {
         Main.notify("ErrorDisplay:", e.message);
      }
   },

   loadClassic: function() {
      this.controlSearchBox.add(this.hoverBox, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.END, expand: true });
      this.powerBox = new PowerBox(this, "vertical", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.favBoxWrapper.add(this.powerBox.actor, { y_align: St.Align.END, y_fill: false, expand: false });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.END, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add_actor(this.spacerApp.actor);
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadStylized: function() {
      this.controlSearchBox.add(this.hoverBox, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add_actor(this.spacerApp.actor);
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadDragon: function() {
      this.controlSearchBox.add(this.hoverBox, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.operativePanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, false);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add_actor(this.spacerApp.actor);
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadDragonInverted: function() {
      this.controlSearchBox.add(this.hoverBox, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.operativePanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, false);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add_actor(this.spacerApp.actor);
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadHorizontal: function() {
      this.controlSearchBox.add(this.hoverBox, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, false, this.favoritesLinesNumber);
      this.betterPanel.set_vertical(true);
      this.operativePanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, false);
      this.favBoxWrapper.set_vertical(false);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, false);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { x_fill: false, x_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.operativePanel.add_actor(this.spacerApp.actor);
      this.endBox.add(this.favBoxWrapper, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: true });
      this.favoritesBox.style_class = '';
      this.favBoxWrapper.style_class = 'menu-favorites-box';
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: true, y_align: St.Align.END, expand: true });
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadAccessible: function() {
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.staticBox = new StaticBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize);
      this.staticBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      //this.staticBox.takeHover(true);
      //this.staticBox.takeControl(true);
      //this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.staticBox.actor, { y_fill: true, expand: false });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add_actor(this.spacerApp.actor);
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadAccessibleInverted: function() {
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.staticBox = new StaticBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize);
      this.staticBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      //this.staticBox.takeHover(true);
      //this.staticBox.takeControl(true);
      //this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerWindows.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.staticBox.actor, { y_fill: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add_actor(this.spacerApp.actor);
      this.endBox.add_actor(this.endHorizontalBox);
   },

   loadMint: function() {
      this.allowFavName = true;
      this.controlBox.add(this.panelAppsName, {x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: false });
      this.bttChanger = new ButtonChangerBox(this, "forward", [_("All Applications"), _("Favorites")], 0, Lang.bind(this, this._onPanelMintChange));
      this.bttChanger.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.controlSearchBox.add(this.bttChanger.actor, {x_fill: false, x_align: St.Align.END, y_align: St.Align.START, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.staticBox = new StaticBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize);
      this.staticBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.favoritesBox.style_class = '';
      this.betterPanel.style_class = 'menu-favorites-box';
      this.betterPanel.set_vertical(true);
      this.betterPanel.add(this.favBoxWrapper, { x_fill: true, y_fill: true, y_align: St.Align.MIDDLE, expand: true });
      this.betterPanel.add_actor(this.spacerApp.actor);
      this.betterPanel.add_actor(this.endHorizontalBox);
      this.favBoxWrapper.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.operativePanel.visible = false;
      this.mainBox.add(this.staticBox.actor, { y_fill: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.staticBox.setNamesVisible(true);
      this.searchName.visible = true;
      this.panelAppsName.visible = true;
   },

   loadWindows: function() {
      this.allowFavName = true;
      this.bttChanger = new ButtonChangerBox(this, "forward", [_("All Applications"), _("Favorites")], 0, Lang.bind(this, this._onPanelWindowsChange));
      this.bttChanger.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: true, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.staticBox = new StaticBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize);
      this.staticBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.betterPanel.set_vertical(true);
      this.betterPanel.add_actor(this.endHorizontalBox);
      this.betterPanel.add_actor(this.spacerApp.actor);
      this.betterPanel.add(this.favBoxWrapper, { x_fill: true, y_fill: true, y_align: St.Align.MIDDLE, expand: true });
      this.favBoxWrapper.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.endBox.add_actor(this.spacerWindows.actor);
      this.endBox.add(this.bttChanger.actor, { x_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: false });
      this.endBox.add(this.searchBox, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.END, expand: false });
      this.betterPanel.add(this.endBox, { x_fill: true, y_fill: true, y_align: St.Align.END, expand: false });
      this.operativePanel.visible = false;
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.staticBox.actor, { y_fill: true });
      this.favoritesBox.style_class = '';
      this.betterPanel.style_class = 'menu-favorites-box';
      this.bttChanger.actor.set_style("padding-top: 6px;");
      this.endHorizontalBox.set_style("padding-right: 0px;");
      //this.endHorizontalBox.visible = false;
   },

   _onPanelMintChange: function(selected) {
      let operPanelVisible = false;
      let titleAppBar = _("All Applications");
      if(titleAppBar == selected) {
         this.panelAppsName.set_text(_("Favorites"));
         operPanelVisible = true;
      } else {
         this.panelAppsName.set_text(_("All Applications"));
      }
      this._clearView();
      this.operativePanel.visible = !operPanelVisible;
      this.favoritesScrollBox.actor.visible = operPanelVisible;
      this._updateSize();
   },

   _onPanelWindowsChange: function(selected) {
      let operPanelVisible = false;
      let titleAppBar = _("All Applications");
      if(titleAppBar == selected)
         operPanelVisible = true;
      this._clearView();
      this.powerBox.actor.visible = operPanelVisible;
      this.hover.actor.visible = operPanelVisible;
      this.staticBox.actor.visible = operPanelVisible;
      this.operativePanel.visible = !operPanelVisible;
      this.favoritesScrollBox.actor.visible = operPanelVisible;
     /* if((this.showAppTitle)||(this.showAppDescription))
         this.endHorizontalBox.visible = !operPanelVisible;*/
      this._updateSize();
   },

   _listBookmarks: function(pattern) {
       let bookmarks = Main.placesManager.getBookmarks();
       let special = this._listSpecialBookmarks();
       var res = new Array();
       for (let id = 0; id < special.length; id++) {
          if (!pattern || special[id].name.toLowerCase().indexOf(pattern)!=-1) res.push(special[id]);
       }
       for (let id = 0; id < bookmarks.length; id++) {
          if (!pattern || bookmarks[id].name.toLowerCase().indexOf(pattern)!=-1) res.push(bookmarks[id]);
       }
       return res;
   },

   _listSpecialBookmarks: function() {
      if(!this.specialBookmarks) {
         this.specialBookmarks = new Array();
         this.specialBookmarks.push(new SpecialBookmarks(_("Computer"), "computer", "computer:///"));
         this.specialBookmarks.push(new SpecialBookmarks(_("Home"), "folder-home", GLib.get_home_dir()));
         this.specialBookmarks.push(new SpecialBookmarks(_("Desktop"), "desktop", USER_DESKTOP_PATH));
         this.specialBookmarks.push(new SpecialBookmarks(_("Trash"), "user-trash", "trash:///"));
      }
      return this.specialBookmarks;
   },

   _clearAllSelections: function(hide_apps) {
       for(let i = 0; i < this._applicationsButtons.length; i++) {
          this._applicationsButtons[i].actor.style_class = "menu-application-button";
          if(hide_apps) {
             this._applicationsButtons[i].actor.hide();
          }
       }
       for(let i = 0; i < this._categoryButtons.length; i++){
          let actor = this._categoryButtons[i].actor;
          actor.style_class = "menu-category-button";
          actor.show();
       }
    },

    _setCategoriesButtonActive: function(active) {         
       try {
          for(let i = 0; i < this._categoryButtons.length; i++) {
             let button = this._categoryButtons[i].actor;
             if(active) {
                button.set_style_class_name("menu-category-button");
             } else {
                button.set_style_class_name("menu-category-button-greyed");
             }
          }
       } catch (e) {
          global.log(e);
       }
   },

   _clearPrevCatSelection: function(actor) {
      if(this._previousTreeSelectedActor && this._previousTreeSelectedActor != actor) {
         this._previousTreeSelectedActor.style_class = "menu-category-button";
         if(this._previousTreeSelectedActor._delegate) {
            this._previousTreeSelectedActor._delegate.emit('leave-event');
         }

         if(actor !== undefined) {
            this._previousVisibleIndex = null;
            this._previousTreeSelectedActor = actor;
         }
      } else {
         for(let i = 0; i < this._categoryButtons.length; i++) {
            this._categoryButtons[i].actor.style_class = "menu-category-button";
         }
      }
   },

   _select_category: function(dir, categoryButton) {
      if(dir)
         this._displayButtons(this._listApplications(dir.get_menu_id()));
      else
         this._displayButtons(this._listApplications(null));
      this.closeApplicationsContextMenus(null, false);
   },

   closeApplicationsContextMenus: function(excludeApp, animate) {
      for(var app in this._applicationsButtons) {
         if((app!=excludeApp)&&(this._applicationsButtons[app].menu)&&(this._applicationsButtons[app].menu.isOpen)) {
            if(animate)
               this._applicationsButtons[app].toggleMenu();
            else
               this._applicationsButtons[app].closeMenu();
         }
      }
      for(var app in this._favoritesButtons) {
         if((app!=excludeApp)&&(this._favoritesButtons[app].menu)&&(this._favoritesButtons[app].menu.isOpen)) {
            if(animate)
               this._favoritesButtons[app].toggleMenu();
            else
               this._favoritesButtons[app].closeMenu();
         }
      }
      for(var app in this._placesButtons) {
         if((app!=excludeApp)&&(this._placesButtons[app].menu)&&(this._placesButtons[app].menu.isOpen)) {
            if(animate)
               this._placesButtons[app].toggleMenu();
            else
               this._placesButtons[app].closeMenu();
         }
      }
      if(this.staticBox)
         this.staticBox.closeContextMenus(excludeApp, animate);
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
         let parentTrans = this._transientButtons[indexT].actor.get_parent();
         if(parentTrans)
            parentTrans.remove_actor(this._transientButtons[indexT].actor);
         this._transientButtons[indexT].actor.destroy();
      }
      this._transientButtons = new Array();
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
         this._applicationsBoxWidth = actor.get_width(); // The answer to life...
         //this.applicationsBox.set_width(this.iconViewCount*this._applicationsBoxWidth + 42);
         if(this.theme == "windows7") {
            this.searchEntry.set_width(this._applicationsBoxWidth);
         }
      }
   },

   _refreshFavs: function() {
      //Remove all favorites
     /* this.favoritesBox.get_children().forEach(Lang.bind(this, function (child) {
          child.destroy();
      }));

      let favoritesBox = new CinnamonMenu.FavoritesBox();
      this.favoritesBox.add_actor(favoritesBox.actor);*/
      //this.favoritesScrollBox.set_width(-1)
      //this.favoritesBox.set_width(-1);
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
            let button = new FavoritesButtonExtended(this, this.favoritesScrollBox, this.iconView, this.favoritesObj.getVertical(), app,
                                                     launchers.length/this.favoritesLinesNumber,
                                                     this.iconMaxFavSize, this.allowFavName);
            // + 3 because we're adding 3 system buttons at the bottom
            //button.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(4)+"px;padding-right: "+(-5)+"px;margin:auto;";
            this._favoritesButtons[app] = button;
            this.favoritesObj.add(button.actor, button.menu, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            //favoritesBox.actor.add(button.actor, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            button.actor.connect('enter-event', Lang.bind(this, function() {
               this._clearPrevCatSelection();
               this.hover.refreshApp(button.app);
               if(button.app.get_description())
                  this.selectedAppBox.setSelectedText(button.app.get_name(), button.app.get_description().split("\n")[0]);
               else
                  this.selectedAppBox.setSelectedText(button.app.get_name(), "");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this.selectedAppBox.setSelectedText("", "");
               this.hover.refreshFace();
            }));
            button.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            ++j;
         }
      }
   },

   _refreshApps: function() {
      for(let i = 0; i < this._categoryButtons.length; i++)
         this._categoryButtons[i].actor.destroy();
      this.applicationsBox.destroy_all_children();
      this._applicationsButtons = new Array();
      this._transientButtons = new Array();
      this._categoryButtons = new Array();
      this._applicationsButtonFromApp = new Object(); 
      this._applicationsBoxWidth = 0;
      this._activeContainer = null;
      //this.favoritesScrollBox.set_width(-1);
      //Remove all categories
      this._clearView();
      this.iconViewCount = 1;
      this.categoriesBox.destroy_all_children();

      this._allAppsCategoryButton = new CategoryButtonExtended(null, this.iconCatSize, this.showCategoriesIcons);
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
      //this.categoriesBox.add_actor(this._allAppsCategoryButton.actor);
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
                  let categoryButton = new CategoryButtonExtended(dir, this.iconCatSize, this.showCategoriesIcons);
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
                 // this.categoriesBox.add_actor(categoryButton.actor);
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
      try {
      //Mainloop.idle_add(Lang.bind(this, function() {

         let catVertical = !this.categoriesBox.get_vertical();
         if(this.categoriesBox.get_children().length == 0)
            this.categoriesBox.add_actor(new St.BoxLayout({ vertical: this.categoriesBox.get_vertical() }));
         let viewBox = this.categoriesBox.get_children()[0];
         for(let i = 0; i < this._categoryButtons.length; i++) {
            this._categoryButtons[i].setVertical(catVertical);
            viewBox.add_actor(this._categoryButtons[i].actor);
         }
         //Main.notify("Fueron:" + viewBox.get_children().length);

         this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
         this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
         this._select_category(null, this._allAppsCategoryButton);
      } catch(e) {Main.notify("errr", e.message);}
     // }));
      this._refreshPlacesAndRecent();
   },

   _refreshPlacesAndRecent : function() {
      let newCatSelection = new Array();
      for(let i = 0; i < this._placesButtons.length; i ++) {
         this._placesButtons[i].actor.destroy();
      }
      for(let i = 0; i < this._recentButtons.length; i ++) {
         this._recentButtons[i].actor.destroy();
      }
      if(this.categoriesBox.get_children().length == 0)
         this.categoriesBox.add_actor(new St.BoxLayout({ vertical: this.categoriesBox.get_vertical() }));
      let tempCat;
      for(let i = 0; i < this._categoryButtons.length; i++) {
         tempCat = this._categoryButtons[i]
         if(!(tempCat instanceof PlaceCategoryButtonExtended) && 
            !(tempCat instanceof RecentCategoryButtonExtended)) {
            newCatSelection.push(this._categoryButtons[i]);
         } else {
            this.categoriesBox.get_children()[0].remove_actor(this._categoryButtons[i].actor);
            this._categoryButtons[i].actor.destroy();
         }
      }
      this._categoryButtons = newCatSelection;
      //Main.notify("puedo" + this.showPlaces);
      this._placesButtons = new Array();
      this._recentButtons = new Array();

      // Now generate Places category and places buttons and add to the list
      if(this.showPlaces) {
         this.placesButton = new PlaceCategoryButtonExtended(null, this.iconCatSize, this.showCategoriesIcons);
         this._addEnterEvent(this.placesButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.placesButton.isHovered = true;
               if(this.hover_delay > 0) {
                  Tweener.addTween(this, {
                     time: this.hover_delay, onComplete: function () {
                        if(this.placesButton.isHovered) {
                           this._clearPrevCatSelection(this.placesButton.actor);
                           this.placesButton.actor.style_class = "menu-category-button-selected";
                           this._displayButtons(null, -1);
                        }
                     }
                  });
               } else {
                  this._clearPrevCatSelection(this.placesButton.actor);
                  this.placesButton.actor.style_class = "menu-category-button-selected";
                  this._displayButtons(null, -1);
               }
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
         this.placesButton.setVertical(!this.categoriesBox.get_vertical());
         this.categoriesBox.get_children()[0].add_actor(this.placesButton.actor);

         let bookmarks = this._listBookmarks();
         let devices = this._listDevices();
         let places = bookmarks.concat(devices);
         for(let i = 0; i < places.length; i++) {
            let place = places[i];
            let button = new PlaceButtonExtended(this, this.applicationsScrollBox, place, this.iconView, this.iconAppSize);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               if(this._listDevices().indexOf(button.place) != -1)
                  this.selectedAppBox.setSelectedText("", button.place.id.slice(13));
               else
                  this.selectedAppBox.setSelectedText("", button.place.id.slice(16));
               this.hover.refreshPlace(button.place);
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this._previousSelectedActor = button.actor;
               button.actor.style_class = "menu-application-button";
               this.selectedAppBox.setSelectedText("", "");
               this.hover.refreshFace();
            }));
            this._placesButtons.push(button);
         }
      }
      // Now generate recent category and recent files buttons and add to the list
      if(this.showRecent) {
         this.recentButton = new RecentCategoryButtonExtended(null, this.iconCatSize, this.showCategoriesIcons);
         this._addEnterEvent(this.recentButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.recentButton.isHovered = true;
               if(this.hover_delay > 0) {
                  Tweener.addTween(this, {
                     time: this.hover_delay, onComplete: function () {
                        if(this.recentButton.isHovered) {
                           this._clearPrevCatSelection(this.recentButton.actor);
                           this.recentButton.actor.style_class = "menu-category-button-selected";
                           this._displayButtons(null, null, -1);
                        }
                     }
                  });
               } else {
                  this._clearPrevCatSelection(this.recentButton.actor);
                  this.recentButton.actor.style_class = "menu-category-button-selected";
                  this._displayButtons(null, null, -1);
               }
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

         this.categoriesBox.get_children()[0].add_actor(this.recentButton.actor);
         this.recentButton.setVertical(!this.categoriesBox.get_vertical());
         this._categoryButtons.push(this.recentButton);

         for(let id = 0; id < MAX_RECENT_FILES && id < this.RecentManager._infosByTimestamp.length; id++) {
            let button = new RecentButtonExtended(this, this.RecentManager._infosByTimestamp[id], this.iconView, this.iconAppSize);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppBox.setSelectedText("", button.file.uri.slice(7));
               this.hover.refreshFile(button.file);
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.selectedAppBox.setSelectedText("", "");
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

   _appLeaveEvent: function(a, b, applicationButton) {
      this._previousSelectedActor = applicationButton.actor;
      applicationButton.actor.style_class = "menu-application-button";
      this.selectedAppBox.setSelectedText("", "");
      this.hover.refreshFace();
   },

   _appEnterEvent: function(applicationButton) {
      if(applicationButton.app.get_description())
         this.selectedAppBox.setSelectedText(applicationButton.app.get_name(), applicationButton.app.get_description());
      else
         this.selectedAppBox.setSelectedText(applicationButton.app.get_name(), "");
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
                  let applicationButton = new ApplicationButtonExtended(this, this.applicationsScrollBox, app, this.iconView, this.iconAppSize, this.iconMaxFavSize);
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

   _initialDisplay: function() {
      if(!this.displayed) {
         this.initButtonLoad = 30;
         let n = Math.min(this._applicationsButtons.length, this.initButtonLoad);
         for(let i = 0; i < n; i++) {
            if(!this._applicationsButtons[i].actor.visible)
               this._applicationsButtons[i].actor.show();
         }
         Mainloop.idle_add(Lang.bind(this, this._initial_cat_selection));
         this.displayed = true;
         if(!this.fullScreen) {
            let monitor = Main.layoutManager.findMonitorForActor(this.actor);
            let maxHeigth = monitor.height - this._processPanelSize(true) - this._processPanelSize(false);
            if(this.height > maxHeigth)
               this.height = maxHeigth;
            if(this.width > monitor.width)
               this.width = monitor.width;
            this.mainBox.set_width(this.width);
            this.mainBox.set_height(this.height);
            if(this.updateTheme) {
               this.updateTheme = false;
               Mainloop.idle_add(Lang.bind(this, this._updateSize()));
            }
         } else {
            this._setFullScreen();
         }
      }
   },

   _onOpenStateChanged: function(menu, open) {
      if(open) {
         this.menuIsOpening = true;
         this.actor.add_style_pseudo_class('active');
         global.stage.set_key_focus(this.searchEntry);
         this._selectedItemIndex = null;
         this._activeContainer = null;
         this._activeActor = null;
         this._initialDisplay();
         this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
         this.selectedAppBox.setDateTimeVisible(this.showTimeDate);
      }
      else {
         if(this.bttChanger) 
            this.bttChanger.activateSelected(_("All Applications"));
         this._disableResize();
         this.actor.remove_style_pseudo_class('active');
         if(this.searchActive) {
            this.resetSearch();
         }
         this.selectedAppBox.setSelectedText("", "");
         this.hover.refreshFace();
         this.hover.closeMenu();
         this._previousTreeItemIndex = null;
         this._previousTreeSelectedActor = null;
         this._previousSelectedActor = null;
         this.closeApplicationsContextMenus(null, false);
         this._clearAllSelections(false);
         this._refreshFavs();
         if(this.staticBox)
            this.staticBox.refreshAccessibleItems();
         this.destroyVectorBox();
         this.powerBox.disableSelected();
         this.selectedAppBox.setDateTimeVisible(false);
      }
   }
};

function main(metadata, orientation, panel_height, instance_id) {  
    let myApplet = new MyApplet(metadata, orientation, panel_height, instance_id);
    return myApplet;      
}
