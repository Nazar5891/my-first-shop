export type CategoryId = 
  | 'urgent'          // 🔴 Термінова допомога
  | 'rideshare'       // 🚗 Підвіз / Попутки (BlaBlaCar)
  | 'sale_goods'      // 🛍️ Продаж: Товари, Продукти, Побут
  | 'sale_auto_build' // 🧱 Продаж: Авто, Будматеріали, Запчастини
  | 'service'         // 🔵 Послуги та Майстри
  | 'part_time'       // 🟠 Підробіток
  | 'full_time'       // 🟢 Постійна робота
  | 'internet'        // 🌐 Інтернет та Зв'язок
  | 'machinery'       // 🟣 Техніка
  | 'seasonal'        // 🟡 Сезонна робота
  | 'sale'            // 📦 Продаж (загальний / архівний)
  | 'help';           // 🤝 Допомога

export type RideRole = 'passenger' | 'driver';
export type ServiceStatusType = 'urgent' | 'hourly' | 'daily' | 'permanent' | 'delivery' | 'seasonal';

export interface ServiceStatusInfo { id: ServiceStatusType; label: string; shortLabel: string; symbol: string; colorClass: string; borderClass: string; bgClass: string; markerBadge: string; }
export const SERVICE_STATUSES: Record<ServiceStatusType, ServiceStatusInfo> = {
  urgent: { id:'urgent', label:'ТЕРМІНОВО — потрібна допомога зараз', shortLabel:'Терміново', symbol:'🔴', colorClass:'text-red-500', borderClass:'border-red-500', bgClass:'bg-red-500/20 text-red-300 border-red-500/40', markerBadge:'🔴 ТЕРМІНОВО' },
  hourly: { id:'hourly', label:'НА ЧАС — на кілька годин', shortLabel:'На час', symbol:'🟠', colorClass:'text-orange-500', borderClass:'border-orange-500', bgClass:'bg-orange-500/20 text-orange-300 border-orange-500/40', markerBadge:'🟠 НА ЧАС' },
  daily: { id:'daily', label:'ОДНОДЕННА — робота на один день', shortLabel:'Одноденна', symbol:'🟡', colorClass:'text-yellow-500', borderClass:'border-yellow-500', bgClass:'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', markerBadge:'🟡 ОДНОДЕННА' },
  permanent: { id:'permanent', label:'ПОСТІЙНА — регулярна послуга', shortLabel:'Постійна', symbol:'🟢', colorClass:'text-emerald-500', borderClass:'border-emerald-500', bgClass:'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', markerBadge:'🟢 ПОСТІЙНА' },
  delivery: { id:'delivery', label:'ДОСТАВКА — привезти/забрати', shortLabel:'Доставка', symbol:'🔵', colorClass:'text-blue-500', borderClass:'border-blue-500', bgClass:'bg-blue-500/20 text-blue-300 border-blue-500/40', markerBadge:'🔵 ДОСТАВКА' },
  seasonal: { id:'seasonal', label:'СЕЗОННА — роботи, пов’язані з сезоном', shortLabel:'Сезонна', symbol:'🟣', colorClass:'text-purple-500', borderClass:'border-purple-500', bgClass:'bg-purple-500/20 text-purple-300 border-purple-500/40', markerBadge:'🟣 СЕЗОННА' },
};

export type UrgencyLevel = 'immediate' | 'hours' | 'today';
export type UrgentHelpType = 'medical' | 'auto' | 'physical' | 'equipment' | 'other';
export type PayType = 'fixed' | 'hourly' | 'daily' | 'monthly' | 'free';

export interface ListingComment { id:string; authorName:string; text:string; createdAt:string; rating?:number; verifiedUser?:boolean; }

export interface Listing {
  id:string; title:string; category:CategoryId; subcategory?:string; statusType?:ServiceStatusType; performerName?:string; rating?:number; availabilityStatus?:'available'|'busy'; serviceCategoryGroup?:string;
  description:string; pay:string; payValueNumber:number; payType:PayType; locationName:string; coordinates:[number,number]; destinationCoordinates?:[number,number]; distanceMeters:number; when:string; duration:string; phone:string; createdAt:string; isUrgent:boolean; urgencyLevel?:UrgencyLevel; urgentType?:UrgentHelpType; photoUrl?:string; verified:boolean; viewsCount:number; callsCount:number;
  rideRole?:RideRole; rideRouteFrom?:string; rideRouteTo?:string; rideDepartureTime?:string; rideSeats?:number; rideCarInfo?:string;
  comments?:ListingComment[];
}

export interface CategoryInfo { id:CategoryId; label:string; shortLabel:string; color:string; bgColor:string; borderColor:string; textColor:string; badgeBg:string; markerColor:string; iconName:string; pinSymbol:string; subcategories?:string[]; }

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  urgent:{id:'urgent',label:'Термінова допомога',shortLabel:'Терміново',color:'#ef4444',bgColor:'bg-red-500',borderColor:'border-red-500',textColor:'text-red-600',badgeBg:'bg-red-50 text-red-700 border-red-200',markerColor:'#ef4444',iconName:'Siren',pinSymbol:'🔴',subcategories:['Автомобільна допомога','Медична / Ліки','Побут / Аварії','Електрика / Генератор','Втрачені речі / Тварини']},
  rideshare:{id:'rideshare',label:'Підвіз / Попутки (BlaBlaCar)',shortLabel:'Підвіз 🚗',color:'#0284c7',bgColor:'bg-sky-600',borderColor:'border-sky-500',textColor:'text-sky-600',badgeBg:'bg-sky-50 text-sky-700 border-sky-200',markerColor:'#0284c7',iconName:'Car',pinSymbol:'🚗',subcategories:['Водій (Пропоную поїздку)','Пасажир (Шукаю підвіз)','Міжміські поїздки','Вантажний підвіз / Посилки']},
  sale_goods:{id:'sale_goods',label:'Товари, Продукти, Побут',shortLabel:'Товари 🛍️',color:'#10b981',bgColor:'bg-emerald-600',borderColor:'border-emerald-500',textColor:'text-emerald-600',badgeBg:'bg-emerald-50 text-emerald-700 border-emerald-200',markerColor:'#10b981',iconName:'ShoppingBag',pinSymbol:'🛍️',subcategories:['Продукти харчування / Сільгосппродукція','Побутова техніка та Меблі','Одяг, Взуття та Дитячі речі','Дрова, Опалення та Госптовари']},
  sale_auto_build:{id:'sale_auto_build',label:'Авто, Будматеріали, Запчастини',shortLabel:'Авто / Буд 🧱',color:'#f59e0b',bgColor:'bg-amber-600',borderColor:'border-amber-500',textColor:'text-amber-600',badgeBg:'bg-amber-50 text-amber-700 border-amber-200',markerColor:'#f59e0b',iconName:'Hammer',pinSymbol:'🧱',subcategories:['Будматеріали та Інструменти','Автозапчастини та Шини','Сільгосптехніка та Запчастини','Електроніка та Обладнання']},
  service:{id:'service',label:'Послуги та Майстри',shortLabel:'Послуги',color:'#3b82f6',bgColor:'bg-blue-500',borderColor:'border-blue-500',textColor:'text-blue-600',badgeBg:'bg-blue-50 text-blue-700 border-blue-200',markerColor:'#3b82f6',iconName:'Wrench',pinSymbol:'🔵',subcategories:['Сантехніка та Опалення','Електрика та Інтернет','Будівництво та Ремонт','Побут та Прибирання','Доставка та Вантажні']},
  part_time:{id:'part_time',label:'Підробіток',shortLabel:'Підробіток',color:'#f97316',bgColor:'bg-orange-500',borderColor:'border-orange-500',textColor:'text-orange-600',badgeBg:'bg-orange-50 text-orange-700 border-orange-200',markerColor:'#f97316',iconName:'Briefcase',pinSymbol:'🟠',subcategories:['Вантажні роботи','Прибирання території / Сад','Ремонтні роботи','Догляд / Допомога','Підсобний робітник']},
  full_time:{id:'full_time',label:'Постійна робота',shortLabel:'Постійна робота',color:'#10b981',bgColor:'bg-emerald-500',borderColor:'border-emerald-500',textColor:'text-emerald-600',badgeBg:'bg-emerald-50 text-emerald-700 border-emerald-200',markerColor:'#10b981',iconName:'Building2',pinSymbol:'🟢',subcategories:['Торгівля та Продавці','Водії та Логістика','Будівельні спеціальності','Сільське та Лісове господарство','Офіс та Каса']},
  internet:{id:'internet',label:"Інтернет та Зв'язок",shortLabel:'Інтернет',color:'#06b6d4',bgColor:'bg-cyan-500',borderColor:'border-cyan-500',textColor:'text-cyan-600',badgeBg:'bg-cyan-50 text-cyan-700 border-cyan-200',markerColor:'#06b6d4',iconName:'Wifi',pinSymbol:'🌐',subcategories:['Starlink','Оптоволокно','Wi-Fi та Роутери','Ремонт кабелю']},
  machinery:{id:'machinery',label:'Техніка та Спецтехніка',shortLabel:'Техніка',color:'#a855f7',bgColor:'bg-purple-500',borderColor:'border-purple-500',textColor:'text-purple-600',badgeBg:'bg-purple-50 text-purple-700 border-purple-200',markerColor:'#a855f7',iconName:'Tractor',pinSymbol:'🟣',subcategories:['Трактори та Сільгосптехніка','Оренда спецтехніки','Генератори та Електростанції','Мотоблоки та Садова техніка']},
  seasonal:{id:'seasonal',label:'Сезонна робота',shortLabel:'Сезонна',color:'#eab308',bgColor:'bg-amber-500',borderColor:'border-amber-500',textColor:'text-amber-600',badgeBg:'bg-amber-50 text-amber-700 border-amber-200',markerColor:'#eab308',iconName:'Sun',pinSymbol:'🟡',subcategories:['Збір врожаю / Ягоди / Гриби','Заготівля дров','Сільгоспроботи (весна/осінь)','Снігоочищення']},
  sale:{id:'sale',label:'Загальний Продаж',shortLabel:'Продаж',color:'#06b6d4',bgColor:'bg-cyan-500',borderColor:'border-cyan-500',textColor:'text-cyan-600',badgeBg:'bg-cyan-50 text-cyan-700 border-cyan-200',markerColor:'#06b6d4',iconName:'ShoppingBag',pinSymbol:'📦',subcategories:['Різне']},
  help:{id:'help',label:'Допомога',shortLabel:'Допомога',color:'#6366f1',bgColor:'bg-indigo-500',borderColor:'border-indigo-500',textColor:'text-indigo-600',badgeBg:'bg-indigo-50 text-indigo-700 border-indigo-200',markerColor:'#6366f1',iconName:'HeartHandshake',pinSymbol:'🤝',subcategories:['Гуманітарна допомога','Волонтерські збори','Втрачені речі','Пошук тварин']},
};

export const URGENT_TYPES_MAP: Record<UrgentHelpType,{label:string;icon:string;example:string}> = {
 medical:{label:'Потрібен лікар / медична допомога',icon:'Stethoscope',example:'Потрібно привезти ліки або виміряти тиск'}, auto:{label:'Зламалося авто / потрібен буксир',icon:'Car',example:'Грузнув у снігу або заглох двигун'}, physical:{label:'Негайна фізична допомога',icon:'ShieldAlert',example:'Потрібно підняти важке або розібрати завал'}, equipment:{label:'Інструменти / Генератор',icon:'Zap',example:'Терміново потрібен генератор / зварювальний апарат'}, other:{label:'Інша термінова допомога',icon:'AlertCircle',example:'Невідкладна ситуація в громаді'}
};
export const URGENCY_LEVELS_MAP: Record<UrgencyLevel,{label:string;subtext:string;badgeClass:string}> = {
 immediate:{label:'Вкрай терміново — зараз!',subtext:'Потрібно протягом 15-30 хвилин',badgeClass:'bg-red-600 text-white animate-pulse'}, hours:{label:'Протягом 1-2 годин',subtext:'Потрібно якнайшвидше сьогодні',badgeClass:'bg-red-500 text-white'}, today:{label:'Сьогодні до кінця дня',subtext:'Терміново протягом дня',badgeClass:'bg-red-100 text-red-700 border border-red-300'}
};
export type ActiveTab = 'map' | 'search' | 'near' | 'add' | 'more';
export type SortOption = 'distance' | 'pay' | 'newest' | 'urgent';
