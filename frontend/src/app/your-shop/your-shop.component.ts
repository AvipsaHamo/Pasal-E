import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { ShopService } from '../core/services/shop.service';
import { ShopInfo, CategoryDetail } from '../core/models/shop.models';
import { DestroyableComponent } from '../core/base/destroyable.base';

@Component({
  selector: 'app-your-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './your-shop.component.html',
  styleUrl: './your-shop.component.css'
})
export class YourShopComponent extends DestroyableComponent implements OnInit {
  shop:       ShopInfo | null  = null;
  categories: CategoryDetail[] = [];
  loading     = true;
  loadError   = '';
  saving      = false;
  saveMsg     = '';
  saveError   = '';
  copySuccess = false;

  uploadingLogo    = false;
  uploadingBanner  = false;
  uploadingCatImg  = false;
  uploadError      = '';
  newCategoryImageUrl: string | null = null;

  showAddCategory  = false;
  addingCategory   = false;
  addCategoryError = '';

  readonly themes  = ['Light', 'Dark'];
  readonly colours = ['Green', 'Blue', 'Red', 'Purple', 'Pink', 'Brown', 'Gray'];

  shopForm = this.fb.group({
    brandName:        [''],
    physicalLocation: [''],
    theme:            [''],
    colour:           ['']
  });

  categoryForm = this.fb.group({
    name: ['', Validators.required]
  });

  constructor(private shopSvc: ShopService, private fb: FormBuilder) { super(); }

  ngOnInit(): void {
    this.loadShop();
    this.loadCategories();
  }

  private loadShop(): void {
    this.loading   = true;
    this.loadError = '';
    this.shopSvc.getShop()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: s => {
          this.shop    = s;
          this.loading = false;
          this.shopForm.patchValue({
            brandName:        s.brandName        ?? '',
            physicalLocation: s.physicalLocation ?? '',
            theme:            s.theme            ?? '',
            colour:           s.colour           ?? ''
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading   = false;
          this.loadError = err?.error?.message ?? 'Failed to load shop details.';
        }
      });
  }

  loadCategories(): void {
    this.shopSvc.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  c => this.categories = c,
        error: (err: { error?: { message?: string } }) =>
          console.error('Failed to load categories:', err?.error?.message ?? err)
      });
  }

  get subdomainUrl(): string {
    return this.shop?.subdomain
      ? `${this.shop.subdomain}.pasal-e.me`
      : 'yourshopname.pasal-e.me';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      pending:     'status-pending',
      approved:    'status-approved',
      disapproved: 'status-disapproved'
    };
    return map[this.shop?.subdomainStatus ?? 'pending'] ?? '';
  }

  copySubdomain(): void {
    navigator.clipboard.writeText(this.subdomainUrl)
      .then(() => {
        this.copySuccess = true;
        setTimeout(() => this.copySuccess = false, 2000);
      })
      .catch(() => console.error('Clipboard copy failed'));
  }

  onLogoUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.uploadError   = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingLogo = false;
          this.shopSvc.updateShop({ logoImage: res.url })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next:  s => this.shop = s,
              error: (err: { error?: { message?: string } }) => {
                this.uploadError = err?.error?.message ?? 'Failed to save logo.';
              }
            });
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingLogo = false;
          this.uploadError   = err?.error?.message ?? 'Logo upload failed.';
        }
      });
  }

  onBannerUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingBanner = true;
    this.uploadError     = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingBanner = false;
          this.shopSvc.updateShop({ bannerImage: res.url })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next:  s => this.shop = s,
              error: (err: { error?: { message?: string } }) => {
                this.uploadError = err?.error?.message ?? 'Failed to save banner.';
              }
            });
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingBanner = false;
          this.uploadError     = err?.error?.message ?? 'Banner upload failed.';
        }
      });
  }

  onCategoryImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingCatImg = true;
    this.uploadError     = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingCatImg    = false;
          this.newCategoryImageUrl = res.url;
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingCatImg = false;
          this.uploadError     = err?.error?.message ?? 'Image upload failed.';
        }
      });
  }

  onSaveShop(): void {
    this.saving    = true;
    this.saveMsg   = '';
    this.saveError = '';
    const v = this.shopForm.value;

    this.shopSvc.updateShop({
      brandName:        v.brandName        || undefined,
      physicalLocation: v.physicalLocation || undefined,
      theme:            v.theme            || undefined,
      colour:           v.colour           || undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: s => {
          this.shop    = s;
          this.saving  = false;
          this.saveMsg = 'Saved!';
          setTimeout(() => this.saveMsg = '', 2500);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving    = false;
          this.saveError = err?.error?.message ?? 'Failed to save shop details.';
        }
      });
  }

  openAddCategory(): void {
    this.categoryForm.reset();
    this.newCategoryImageUrl = null;
    this.addCategoryError    = '';
    this.showAddCategory     = true;
  }

  closeAddCategory(): void { this.showAddCategory = false; }

  onAddCategory(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
    this.addingCategory   = true;
    this.addCategoryError = '';

    const name = this.categoryForm.value.name ?? '';

    this.shopSvc.addCategory({ name, image: this.newCategoryImageUrl ?? undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    if (!confirm('Delete this category? Products in this category will be uncategorised.')) return;
    this.shopSvc.deleteCategory(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => this.loadCategories(),
        error: (err: { error?: { message?: string } }) =>
          console.error('Delete failed:', err?.error?.message ?? err)
      });
  }
}
