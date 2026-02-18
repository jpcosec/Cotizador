* On REGLAS_NEGOCIO AND CATEGORIAS 
	* There's an arch that might lead to missconceptions Def_Impuesto_ID.
	*   Reglas_negocio should be activated by any other related field and should affect the pricing. Maybe we should take  some time to better define the posible rules so we can draw the diagram more efficiently. 
  * On PERFILES_PRECIO
	  * columns Tiempo_Base_Incuido and Costo_Unitario_Tiempo_Extra should be rules activated by  REGLAS_NEGOCIO and dependant on a categoria or item. 
* On  CATEGORIAS
	* Comportamiento_Base is not a good description  of anything maybe that should be routed to a regla_negocio
	* Also, There are 3 posible parameters for pricing (pax, cantidad, tiempo), categoria should set the dimension of them 3 on def_requiere_cant, requiere tiempo and requiere_pax. Some are not charged by pax but by cantidad. Then the default is calculated by an standard units per pax, mapped in some default calculator (we might be missing this). Also, all the posible things should have a timing and posibly a place. Those go on Linea_detalle.
* On Item_Catalogo
	* There should be a column that maps to perfiles_precio to override the price. 
	* Also there should be a standard default units per_pax per_time calculator. 
* On Cotizaciones there should be a way to manage the global discounts and taxes. It's not important to have calculated values such as Total_Neto, it should be easilly calculable from the historic rules. (NO DATA SHOULD BE DELETED. ANY MODIFICATION SHOULD POINT TO A REWRITING OF OLD DATA)
* I'm not sure wether to wait to have all the other things ready beforehand for linea_detalle or  not. There is too much unnecesary info here. Is should just link the cotizacion to a day/hour, have info on the comments, overriden default values (pax, units or duration) or special rules applied by user intervention. THERE SHOULD NOT BE ANY  CALCULUS MADE HERE. The final Calculus should be made on the run, and it can be stored on it's own sheet, but less is more here.
  
  Finally. All data should have an updated_at field. That way we can update costs or rules without losing the historic info.
*Q