source("./RFiles/loadingLibraries.r")
########### SELECT AND JOIN ############################
DEMO_L.xpt <- read_xpt("../data/DEMO_L.xpt")
DR1IFF_L.xpt <- read_xpt("../data/DR1IFF_L.xpt");

DEMO_L.xpt <- DEMO_L.xpt %>% select(SEQN, RIDAGEYR);
DR1IFF_L.xpt <- DR1IFF_L.xpt %>% select(SEQN, DR1IKCAL, DR1FS);



###### Additional Information for the AI ###############


cat("All about the RIDAGEYR Variable")
cat("# ----
# RIDAGEYR - Age in years at screening
# Variable Name: RIDAGEYR
# SAS Label: Age in years at screening
# English Text: Age in years of the participant at the time of screening.
# Individuals 80 and over are top-coded at 80 years of age.
# Target: Both males and females, 0 YEARS - 150 YEARS
# 
# Code or Value    Value Description           Count   Cumulative
# 0 to 79          Range of Values            11408   11408
# 80               80 years of age and over    525    11933
# .                Missing                       0    11933
# ----")
table(DEMO_L.xpt %>% select(RIDAGEYR))
summary(DEMO_L.xpt %>% select(RIDAGEYR))





cat("All about the DR1IKCAL Variable")
cat("
# -----
# DR1IKCAL - Energy (kcal)
# Variable Name: DR1IKCAL
# SAS Label: Energy (kcal)
# English Text: Energy (kcal)
# Target: Both males and females, 0 YEARS - 150 YEARS
# 
# Code or Value    Value Description    Count   Cumulative
# 0 to 4575        Range of Values     99787   99787
# .                Missing               329  100116
# -----")
table(DR1IFF_L.xpt %>% select(DR1IKCAL))
summary(DR1IFF_L.xpt %>% select(DR1IKCAL))

cat("All about DR1FS Variable")
cat("
# ------
# DR1FS - Source of food
# Variable Name:DR1FSSAS Label:Source of foodEnglish Text:Where did you get (this/most of the ingredients for this) {FOODNAME}?Target:Both males and females 0 YEARS - 150 YEARS
# Code or Value	Value Description	Count	Cumulative	Skip to Item
# 1	Store - grocery/supermarket	67563	67563	
# 2	Restaurant with waiter/waitress	5266	72829	
# 3	Restaurant fast food/pizza	6991	79820	
# 4	Bar/tavern/lounge	294	80114	
# 5	Restaurant no additional information	15	80129	
# 6	Cafeteria NOT in a K-12 school	620	80749	
# 7	Cafeteria in a K-12 school	1547	82296	
# 8	Child/Adult care center	242	82538	
# 9	Child/Adult home care	37	82575	
# 10	Soup kitchen/shelter/food pantry	76	82651	
# 11	Meals on Wheels	73	82724	
# 12	Community food program - other	195	82919	
# 13	Community program no additional information	8	82927	
# 14	Vending machine	165	83092	
# 15	Common coffee pot or snack tray	518	83610	
# 16	From someone else/gift	3634	87244	
# 17	Mail order purchase	1131	88375	
# 18	Residential dining facility	81	88456	
# 19	Grown or caught by you or someone you know	571	89027	
# 20	Fish caught by you or someone you know	8	89035	
# 24	Sport, recreation, or entertainment facility	346	89381	
# 25	Street vendor, vending truck	242	89623	
# 26	Fundraiser sales	61	89684	
# 27	Store - convenience type	2522	92206	
# 28	Store - no additional info	391	92597	
# 91	Other, specify	0	92597	
# 99	Don't know	187	92784	
# .	Missing	7332	100116	
#------
")
table(DR1IFF_L.xpt %>% select(DR1FS))
summary(DR1IFF_L.xpt %>% select(DR1FS))


master <- DR1IFF_L.xpt %>% left_join(DEMO_L.xpt, by = "SEQN")


save.image(file = "RFiles/my_workspace.RData")


