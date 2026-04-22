// src/app/your-shop/your-shop.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ShopService } from '../core/services/shop.service';
import { ShopInfo, CategoryDetail } from '../core/models/shop.models';

@Component({
  selector: 'app-your-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './your-shop.component.html',
  styleUrl: './your-shop.component.css'
})
export class YourShopComponent implements OnInit {
  shop:         ShopInfo | null  = null;
  categories:   CategoryDetail[] = [];
  loading       = true;
  saving        = false;
  saveMsg       = '';
  saveError     = '';
  copySuccess   = false;

  // Add category modal
  showAddCategory  = false;
  addingCategory   = false;
  addCategoryError = '';

  readonly themes  = ['Light', 'Dark'];
  readonly colours = ['Green', 'Blue', 'Red', 'Purple', 'Pink', 'Brown', 'Gray'];

  shopForm = this.fb.group({
    brandName:       [''],
    physicalLocation:[''],
    theme:           [''],
    colour:          [''],
    logoImage:       [''],
    bannerImage:     ['']
  });

  categoryForm = this.fb.group({
    name:  ['', Validators.required],
    image: ['']
  });

  constructor(private shopSvc: ShopService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.shopSvc.getShop().subscribe({
      next: s => {
        this.shop    = s;
        this.loading = false;
        this.shopForm.patchValue({
          brandName:        s.brandName        ?? '',
          physicalLocation: s.physicalLocation ?? '',
          theme:            s.theme            ?? '',
          colour:           s.colour           ?? '',
          logoImage:        s.logoImage        ?? '',
          bannerImage:      s.bannerImage      ?? ''
        });
      },
      error: () => { this.loading = false; }
    });
    this.loadCategories();
  }

  loadCategories(): void {
    this.shopSvc.getCategories().subscribe({ next: c => this.categories = c });
  }

  get subdomainUrl(): string {
    if (!this.shop?.subdomain) return 'yourshopname.pasal-e.me';
    return `${this.shop.subdomain}.pasal-e.me`;
  }

  copySubdomain(): void {
    navigator.clipboard.writeText(this.subdomainUrl).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }

  onSaveShop(): void {
    this.saving   = true;
    this.saveMsg  = '';
    this.saveError = '';
    const v = this.shopForm.value;

    this.shopSvc.updateShop({
      brandName:        v.brandName        || undefined,
      physicalLocation: v.physicalLocation || undefined,
      theme:            v.theme            || undefined,
      colour:           v.colour           || undefined,
      logoImage:        v.logoImage        || undefined,
      bannerImage:      v.bannerImage      || undefined
    }).subscribe({
      next: s => {
        this.shop    = s;
        this.saving  = false;
        this.saveMsg = 'Shop details saved!';
        setTimeout(() => this.saveMsg = '', 2500);
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving    = false;
        this.saveError = err?.error?.message ?? 'Failed to save.';
      }
    });
  }

  // ── Category modal ────────────────────────────────────────────────────
  openAddCategory(): void {
    this.categoryForm.reset();
    this.addCategoryError = '';
    this.showAddCategory  = true;
  }

  closeAddCategory(): void { this.showAddCategory = false; }

  onAddCategory(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
    this.addingCategory   = true;
    this.addCategoryError = '';
    const v = this.categoryForm.value;

    this.shopSvc.addCategory({ name: v.name!, image: v.image || undefined }).subscribe({
      next: () => {
        this.addingCategory  = false;
        this.showAddCategory = false;
        this.loadCategories();
      },
      error: (err: { error?: { message?: string } }) => {
        this.addingCategory   = false;
        this.addCategoryError = err?.error?.message ?? 'Failed to add category.';
      }
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Delete this category?')) return;
    this.shopSvc.deleteCategory(id).subscribe({
      next: () => this.loadCategories()
    });
  }
}
