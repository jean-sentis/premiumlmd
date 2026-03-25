<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div class="lmd-est-form-wrap">
    <form id="lmd-estimation-form" enctype="multipart/form-data">
        <div class="lmd-form-field">
            <label for="lmd-nom">Nom *</label>
            <input type="text" id="lmd-nom" name="nom" required>
        </div>
        <div class="lmd-form-field">
            <label for="lmd-email">Email *</label>
            <input type="email" id="lmd-email" name="email" required>
        </div>
        <div class="lmd-form-field">
            <label for="lmd-telephone">Téléphone</label>
            <input type="tel" id="lmd-telephone" name="telephone">
        </div>
        <div class="lmd-form-field">
            <label for="lmd-description">Description de l'objet *</label>
            <textarea id="lmd-description" name="description" rows="4" required placeholder="Décrivez votre objet : origine, dimensions, état, inscriptions…"></textarea>
        </div>
        <div class="lmd-form-field">
            <label for="lmd-category">Catégorie</label>
            <select id="lmd-category" name="object_category">
                <option value="">— Choisir —</option>
                <option value="tableaux">Tableaux</option>
                <option value="mobilier">Mobilier</option>
                <option value="bijoux">Bijoux & Montres</option>
                <option value="ceramiques">Céramiques</option>
                <option value="argenterie">Argenterie</option>
                <option value="objets_art">Objets d'art</option>
                <option value="livres">Livres & Manuscrits</option>
                <option value="autre">Autre</option>
            </select>
        </div>
        <div class="lmd-form-field">
            <label for="lmd-value">Estimation souhaitée (optionnel)</label>
            <input type="text" id="lmd-value" name="estimated_value" placeholder="Ex: 500 - 1 000 €">
        </div>
        <div class="lmd-form-field">
            <label>Photos (jusqu'à 5)</label>
            <input type="file" name="photos[]" multiple accept="image/*" id="lmd-photos">
            <div id="lmd-photo-preview" class="lmd-photo-preview"></div>
        </div>
        <button type="submit" class="lmd-submit-btn">Envoyer ma demande</button>
        <div id="lmd-form-message" class="lmd-form-message" style="display:none"></div>
    </form>
</div>
